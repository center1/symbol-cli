/*
 *
 * Copyright 2018-present NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import {Account, NetworkType, Password, SimpleWallet, Address} from 'symbol-sdk'
import {expect} from 'chai'

import {ImportType} from '../../src/models/importType.enum'
import {mockProfile1} from '../mocks/profiles/profile.mock'
import {NetworkCurrency} from '../../src/models/networkCurrency.model'
import {Profile} from '../../src/models/profile.model'

const networkCurrency = NetworkCurrency.createFromDTO({namespaceId: 'symbol.xym', divisibility: 6})

describe('Profile', () => {
    it('should contain the fields', () => {
        const profile = Profile.createFromPrivateKey({
            generationHash: 'generationHash',
            importType: ImportType.PrivateKey,
            isDefault: false,
            name: 'default',
            networkCurrency,
            networkType: NetworkType.MIJIN_TEST,
            password: new Password('password'),
            url: 'http://localhost:1234',
            privateKey: Account.generateNewAccount(NetworkType.MIJIN_TEST).privateKey,
        })

        expect(profile.name).to.be.equal('default')
        expect(profile.networkGenerationHash).to.be.equal('generationHash')
        expect(profile.url).to.be.equal('http://localhost:1234')
        expect(profile.networkType).to.be.equal(NetworkType.MIJIN_TEST)
        expect(profile.type).to.be.equal('PrivateKey')
    })

    it('should be created from DTO', () => {
        const profile = Profile.createFromDTO(
            {
                simpleWallet: {
                    name: 'default',
                    network: NetworkType.MIJIN_TEST,
                    address: {
                        address: Account.generateNewAccount(NetworkType.MIJIN_TEST).address.plain(),
                        networkType: NetworkType.MIJIN_TEST,
                    },
                    creationDate: 'test',
                    schema: 'test',
                    encryptedPrivateKey: {
                        encryptedKey: 'test',
                        iv: 'test',
                    },
                },
                networkGenerationHash: 'generationHash',
                url: 'url',
                networkCurrency: {
                    namespaceId: 'symbol.xym',
                    divisibility: 6,
                },
                version: 3,
                default: '1',
                type: 'PrivateKey',
            })
        expect(profile.name).to.be.equal('default')
        expect(profile.networkGenerationHash).to.be.equal('generationHash')
        expect(profile.url).to.be.equal('url')
        expect(profile.networkType).to.be.equal(NetworkType.MIJIN_TEST)
    })

    it('should validate if password opens wallet', () => {
        const password = new Password('password')
        const networkType = NetworkType.MIJIN_TEST
        const profile = Profile.createFromPrivateKey({
            generationHash: 'default',
            importType: ImportType.PrivateKey,
            isDefault: false,
            name: 'default',
            networkCurrency,
            networkType,
            password,
            url: 'http://localhost:3000',
            privateKey: Account.generateNewAccount(networkType).privateKey,
        })

        expect(profile.isPasswordValid(new Password('12345678'))).to.be.equal(false)
        expect(profile.isPasswordValid(password)).to.be.equal(true)
    })

    it('should decrypt profile', async () => {
        const password = new Password('password')
        const networkType = NetworkType.MIJIN_TEST
        const account = Account.generateNewAccount(networkType)

        const profile = Profile.createFromPrivateKey({
            generationHash: 'default',
            importType: ImportType.PrivateKey,
            isDefault: false,
            name: 'default',
            networkCurrency,
            networkType,
            password,
            url: 'http://localhost:3000',
            privateKey: account.privateKey,
        })

        expect(profile.decrypt(password).privateKey).to.equal(account.privateKey)
        expect(profile.address).to.deep.equal(account.address)
    })

    it('should throw error if trying to decrypt profile with an invalid password', () => {
        const networkType = NetworkType.MIJIN_TEST
        const profile = Profile.createFromPrivateKey({
            generationHash: 'default',
            importType: ImportType.PrivateKey,
            isDefault: false,
            name: 'default',
            networkCurrency,
            networkType,
            password: new Password('password'),
            url: 'http://localhost:3000',
            privateKey: Account.generateNewAccount(networkType).privateKey,
        })

        const wrongPassword = new Password('test12345678')
        expect(() => profile.decrypt(wrongPassword))
            .to.throws('The password provided does not match your account password')
    })

    it('should create a profile from mnemonic', () => {
        const generationHash = 'defaultGenerationHash'
        const importType = ImportType.Mnemonic
        const isDefault = false
        const name = 'default'
        const networkType = NetworkType.TEST_NET
        const password = new Password('password')
        const url = 'http://localhost:3000'
        // eslint-disable-next-line max-len
        const mnemonic  = 'uniform promote eyebrow frequent mother order evolve spell elite lady clarify accuse annual tenant rotate walnut wisdom render before million scrub scan crush sense'
        const expectedPath = 'm/44\'/4343\'/0\'/0\'/0\''
        const pathNumber = 0
        const expectedAddress = Address.createFromRawAddress(
            'TA4E47-MGAO57-ZJFORK-CFSPAD-BMWHLX-7UKMZJ-KAOD',
        )

        const profile = Profile.createFromMnemonic({
            generationHash,
            importType,
            isDefault,
            name,
            networkCurrency,
            networkType,
            password,
            url,
            mnemonic,
            pathNumber,
        })
        console.log('profile', profile)

        expect(profile.simpleWallet.address).to.deep.equal(expectedAddress)
        expect(profile.networkGenerationHash).to.equal(generationHash)
        expect(profile.type).to.equal('HD')
        expect(profile.isDefault).to.equal('0')
        expect(profile.name).to.equal(name)
        expect(profile.networkType).to.equal(networkType)
        expect(profile.url).to.equal(url)
        expect(profile.encryptedPassphrase).to.exist
        expect(profile.pathNumber).to.equal(pathNumber)
        expect(profile.path).to.equal(expectedPath)
    })

    it('createFromDTO should instantiate an HD wallet properly', () => {
        const networkType = NetworkType.TEST_NET
        const name = 'profile name'
        const password = new Password('password')
        const simpleWallet = SimpleWallet.createFromPrivateKey(
            name,
            password,
            'A58BD9618B47F5E6B6BACB9B37CC242EDE1A0461AAE8FF2084BC825209D90E18',
            networkType,
        )
        const encryptedPassphrase = 'encryptedPassphrase'
        const path = 'm/44\'/4343\'/0\'/0\'/0\''
        const url = 'http://localhost:3000'
        const networkGenerationHash = 'generationHash'
        const version = 3
        const isDefault = '0'
        const type = 'HD'

        const profile = Profile.createFromDTO({
            // @TODO: use SimpleWallet.toDTO() once it is available in the SDK
            simpleWallet: JSON.parse(JSON.stringify(simpleWallet)),
            url,
            networkGenerationHash,
            networkCurrency: networkCurrency.toDTO(),
            version,
            default: isDefault,
            type,
            encryptedPassphrase,
            path,
        })

        expect(profile.simpleWallet).to.deep.equal(simpleWallet)
        expect(profile.networkGenerationHash).to.equal(networkGenerationHash)
        expect(profile.type).to.equal(type)
        expect(profile.isDefault).to.equal(isDefault)
        expect(profile.name).to.equal(name)
        expect(profile.networkType).to.equal(networkType)
        expect(profile.url).to.equal(url)
        expect(profile.encryptedPassphrase).to.equal(encryptedPassphrase)
        expect(profile.path).to.equal(path)
        expect(profile.pathNumber).to.equal(0)
    })

    it('a PrivateKey profile pathNumber property should be null', () => {
        expect(mockProfile1.pathNumber).to.be.null
    })

    it('toString should return a non-numnl string', () => {
        expect(mockProfile1.toString().length).to.be.greaterThan(0)
    })
})

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
import {expect} from 'chai'
import {NetworkType, Password, SimpleWallet, Account} from 'symbol-sdk'
import {when, spy} from 'ts-mockito'
import * as fs from 'fs'

import {ImportType} from '../../src/models/importType.enum'
import {NetworkCurrency} from '../../src/models/networkCurrency.model'
import {Profile} from '../../src/models/profile.model'
import {profileDTOv1, profileDTO2v2} from '../mocks/profiles/profileDTO.mock'
import {ProfileRepository} from '../../src/respositories/profile.repository'

const networkCurrency = NetworkCurrency.createFromDTO({namespaceId: 'symbol.xym', divisibility: 6})

describe('ProfileRepository', () => {

    let repositoryFileUrl: string

    const removeAccountsFile = () => {
        const file = (process.env.HOME  || process.env.USERPROFILE) + '/' + repositoryFileUrl
        if (fs.existsSync(file)) {
            fs.unlinkSync(file)
        }
    }

    before(() => {
        removeAccountsFile()
        repositoryFileUrl = '.symbolrctest.json'
    })

    beforeEach(() => {
        removeAccountsFile()
    })

    after(() => {
        removeAccountsFile()
    })

    it('should create account repository via constructor', () => {
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        expect(profileRepository).to.not.be.equal(undefined)
        expect(profileRepository['fileUrl']).to.be.equal(repositoryFileUrl)
    })

    it('should save new account', () => {
        const networkType = NetworkType.MIJIN_TEST
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        const profile1 = Profile.createFromPrivateKey({
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

        const savedProfile = profileRepository.save(profile1)
        expect(savedProfile.simpleWallet).to.be.equal(profile1.simpleWallet)
    })

    it('should not save two accounts with the same name', () => {
        const networkType = NetworkType.MIJIN_TEST
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        const profile1 = Profile.createFromPrivateKey({
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

        const profile2 = Profile.createFromPrivateKey({
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

        profileRepository.save(profile1)
        expect(profile1.simpleWallet.encryptedPrivateKey)
            .not.equals(profile2.simpleWallet.encryptedPrivateKey)
        expect(() => profileRepository.save(profile2))
            .to.throws('A profile named default already exists.')
    })

    it('should find an account', () => {
        const networkType = NetworkType.MIJIN_TEST
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        const account = Account.generateNewAccount(networkType)
        const profile = Profile.createFromPrivateKey({
            generationHash: 'test',
            importType: ImportType.PrivateKey,
            isDefault: false,
            name: 'default',
            networkCurrency,
            networkType,
            password: new Password('password'),
            url: 'http://localhost:3000',
            privateKey: account.privateKey,
        })

        profileRepository.save(profile)
        const savedProfile = profileRepository.find('default')

        expect(savedProfile).to.not.be.equal(undefined)

        if (savedProfile instanceof Profile) {
            expect(savedProfile.simpleWallet.address.plain())
                .to.be.equal(account.address.plain())

            expect(savedProfile.simpleWallet.address.networkType)
                .to.be.equal(account.address.networkType)

            expect(savedProfile.url).to.be.equal(profile.url)
            expect(savedProfile.name).to.be.equal(profile.name)
            expect(savedProfile.networkType).to.be.equal(networkType)
            expect(savedProfile.networkGenerationHash).to.be.equal(profile.networkGenerationHash)
        }
    })

    it('should not find not saved account', () => {
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        expect(() => profileRepository.find('name')).to.throw(Error)
    })

    it('should get all profiles',  () => {
        const networkType = NetworkType.MIJIN_TEST
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        const profile1 = Profile.createFromPrivateKey({
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

        const profile2 = Profile.createFromPrivateKey({
            generationHash: 'default',
            importType: ImportType.PrivateKey,
            isDefault: false,
            name: 'dummy profile',
            networkCurrency,
            networkType,
            password: new Password('password'),
            url: 'http://localhost:3000',
            privateKey: Account.generateNewAccount(networkType).privateKey,
        })

        profileRepository.save(profile1)
        profileRepository.save(profile2)
        const all = profileRepository.all()
        expect(all.length).to.be.equal(2)
    })

    it('should get all profiles and update their schemas if necessary',  () => {
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        // @ts-ignore // accessing a private property
        profileRepository.saveProfiles({...profileDTOv1, ...profileDTO2v2})
        const all = profileRepository.all()
        expect(all[0].version).to.not.be.undefined
        expect(all[0].networkCurrency).deep.equal(networkCurrency)
    })

    it('should set and get default profile',  () => {
        const networkType = NetworkType.MIJIN_TEST
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        const profile1 = Profile.createFromPrivateKey({
            generationHash: 'generationHash',
            importType: ImportType.PrivateKey,
            isDefault: false,
            name: 'not default',
            networkCurrency,
            networkType,
            password: new Password('password'),
            url: 'http://localhost:3000',
            privateKey: Account.generateNewAccount(networkType).privateKey,
        })

        const profile2 = Profile.createFromPrivateKey({
            generationHash: 'generationHash',
            importType: ImportType.PrivateKey,
            isDefault: false,
            name: 'default',
            networkCurrency,
            networkType,
            password: new Password('password'),
            url: 'http://localhost:3000',
            privateKey: Account.generateNewAccount(networkType).privateKey,
        })

        profileRepository.save(profile1)
        profileRepository.save(profile2)
        profileRepository.setDefault('default')
        const currentDefaultProfile = profileRepository.getDefaultProfile()

        expect(currentDefaultProfile).to.not.be.equal(undefined)
        if (currentDefaultProfile instanceof Profile) {
            expect(currentDefaultProfile.simpleWallet.address.plain())
                .to.be.equal(profile2.address.plain())
        }
    })

    it('should throw error if default does not exist',  () => {
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        expect(() => profileRepository.getDefaultProfile()).to.throws(Error)
    })

    it('should throw error if unable to create a new file',  () => {
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        const mockedFs: any = spy(fs)
        when(mockedFs.writeFileSync(profileRepository.filePath, '{}', 'utf-8'))
            .thenThrow(new Error())
        expect(() => profileRepository.all()).to.throws(Error)
    })

    it('should throw error if unable to save migrated files',  () => {
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        // @ts-ignore // accessing a private property
        profileRepository.saveProfiles({...profileDTOv1, ...profileDTO2v2})
        const mockedFs: any = spy(fs)
        when(mockedFs.writeFileSync).thenThrow(new Error())
        expect(() => profileRepository.all()).to.throws(Error)
    })
})

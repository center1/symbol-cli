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
import {Account, Address, ISimpleWalletDTO, NetworkType, Password, SimpleWallet} from 'symbol-sdk'
import {ExpectedError} from 'clime'
import {HorizontalTable} from 'cli-table3'
import * as Table from 'cli-table3'

import {DerivationService} from '../services/derivation.service'
import {EncryptionService} from '../services/encryption.service'
import {NetworkCurrency, NetworkCurrencyDTO} from './networkCurrency.model'
import {PrivateKeyProfileCreation, HDProfileCreation} from './profileCreation.types'

export const CURRENT_PROFILE_VERSION = 3

/**
 * Profile data transfer object.
 */
interface ProfileDTO {
    simpleWallet: ISimpleWalletDTO;
    url: string;
    networkGenerationHash: string;
    networkCurrency: NetworkCurrencyDTO;
    version: number;
    default: '0' | '1';
    type: ProfileType;
    encryptedPassphrase?: string;
    path?: string;
}

/**
 * Profile DTO mapped by profile names
 */
export type ProfileRecord = Record<string, ProfileDTO>

/**
 * Profile types.
 */
export type ProfileType = 'PrivateKey' | 'HD'

/**
 * Profile model.
 */
export class Profile {
    private readonly table: HorizontalTable

    /**
     * Constructor.
     * @param {SimpleWallet} simpleWallet - Wallet credentials.
     * @param {string} url - Node URL.
     * @param {string} networkGenerationHash - Network generation hash.
     */
    private constructor(public readonly simpleWallet: SimpleWallet,
        public readonly url: string,
        public readonly networkGenerationHash: string,
        public readonly networkCurrency: NetworkCurrency,
        public readonly version: number,
        public readonly type: ProfileType,
        public readonly isDefault: '0' | '1',
        public readonly encryptedPassphrase?: string,
        public readonly path?: string,
    ) {
        const {namespaceId, divisibility} = networkCurrency

        this.table = new Table({
            style: {head: ['cyan']},
            head: ['Property', 'Value'],
        }) as HorizontalTable

        this.table.push(
            ['Name', this.simpleWallet.name],
            ['Address', this.simpleWallet.address.pretty()],
            ['Network', NetworkType[this.simpleWallet.network]],
            ['Node URL', this.url],
            ['Generation Hash', this.networkGenerationHash],
            ['Network Currency', `name: ${namespaceId.fullName}, divisibility: ${divisibility}`],
            ['Profile type', this.type],
        )

        if (this.type === 'HD' && this.pathNumber !== null) {
            this.table.push(['Path', `Path n. ${this.pathNumber + 1} (${this.path})` ])
        }
    }

    /**
     * Creates a profile from a private key
     * @static
     * @param {PrivateKeyProfileCreation} args
     * @returns {Profile}
     */
    public static createFromPrivateKey(args: PrivateKeyProfileCreation): Profile {
        const simpleWallet = SimpleWallet.createFromPrivateKey(
            args.name, args.password, args.privateKey, args.networkType,
        )

        return new Profile(
            simpleWallet,
            args.url,
            args.generationHash,
            args.networkCurrency,
            CURRENT_PROFILE_VERSION,
            'PrivateKey',
            args.isDefault ? '1' : '0',
        )
    }

    /**
     * Creates a profile from a mnemonic passphrase and a path index
     * @static
     * @param {HDProfileCreation} args
     * @returns {Profile}
     */
    public static createFromMnemonic(args: HDProfileCreation): Profile {
        const path = DerivationService.getPathFromPathNumber(args.pathNumber)
        const {privateKey} = DerivationService.getAccountFromMnemonic(args.mnemonic, args.pathNumber)

        // create Simple Wallet
        const simpleWallet = SimpleWallet.createFromPrivateKey(
            args.name, args.password, privateKey, args.networkType
        )

        // create profile
        return new Profile(
            simpleWallet,
            args.url,
            args.generationHash,
            args.networkCurrency,
            CURRENT_PROFILE_VERSION,
            'HD',
            args.isDefault ? '1' : '0',
            EncryptionService.encrypt(args.mnemonic, args.password),
            path,
        )
    }

    /**
     * Creates a profile object.
     * @param {ProfileDTO} profileDTO
     * @returns {Profile}
     */
    public static createFromDTO(profileDTO: ProfileDTO): Profile {
        return new Profile(
            SimpleWallet.createFromDTO(profileDTO.simpleWallet),
            profileDTO.url,
            profileDTO.networkGenerationHash,
            NetworkCurrency.createFromDTO(profileDTO.networkCurrency),
            profileDTO.version,
            profileDTO.type,
            profileDTO.default,
            profileDTO?.encryptedPassphrase,
            profileDTO?.path,
        )
    }

    /**
     * Gets profile address.
     * @returns {Address}
     */
    public get address(): Address {
        return this.simpleWallet.address
    }

    /**
     * Gets profile network type.
     * @returns {NetworkType}
     */
    public get networkType(): NetworkType {
        return this.simpleWallet.network
    }

    /**
     * Gets profile name.
     * @returns {string}
     */
    public get name(): string {
        return this.simpleWallet.name
    }

    /**
     * Gets path number
     * @returns {(number | null)}
     */
    public get pathNumber(): number | null {
        if (!this.path) {return null}
        return DerivationService.getPathIndexFromPath(this.path)
    }

    /**
     * Returns a profile DTO
     * @returns {ProfileDTO}
     */
    public toDTO(): ProfileDTO {
        // @TODO: use SimpleWallet.toDTO() once it is available in the SDK
        return {
            simpleWallet: JSON.parse(JSON.stringify(this.simpleWallet)),
            url: this.url,
            networkGenerationHash: this.networkGenerationHash,
            networkCurrency: this.networkCurrency.toDTO(),
            version: this.version,
            default: this.isDefault,
            type: this.type,
            encryptedPassphrase: this.encryptedPassphrase,
            path: this.path,
        }
    }

    /**
     * Formats profile as a string.
     * @returns {string}
     */
    public toString(): string {
        return this.table.toString()
    }

    /**
     * Returns true if the password is valid.
     * @param {Password} password.
     * @returns {boolean}
     */
    public isPasswordValid(password: Password): boolean {
        try {
            this.simpleWallet.open(password)
            return true
        } catch (error) {
            return false
        }
    }

    /**
     * Opens a wallet.
     * @param {Password} options - The  attribute "password" should contain the profile's password.
     * @throws {ExpectedError}
     * @returns {Account}
     */
    public decrypt(password: Password): Account {
        if (!this.isPasswordValid(password)) {
            throw new ExpectedError('The password provided does not match your account password')
        }
        return this.simpleWallet.open(password)
    }
}

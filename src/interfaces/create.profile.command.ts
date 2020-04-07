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

import {Account, Password} from 'symbol-sdk'
import {Command, ExpectedError} from 'clime'
import {HorizontalTable} from 'cli-table3'
import {Spinner} from 'cli-spinner'
import * as Table from 'cli-table3'
import chalk from 'chalk'

import {DerivationService} from '../services/derivation.service'
import {EncryptionService} from '../services/encryption.service'
import {ImportType} from '../models/importType.enum'
import {Profile} from '../models/profile.model'
import {ProfileCreation, PrivateKeyProfileCreation, HDProfileCreation} from '../models/profileCreation.types'
import {ProfileRepository} from '../respositories/profile.repository'
import {ProfileService} from '../services/profile.service'

export class AccountCredentialsTable {
    private readonly table: HorizontalTable
    private readonly account: Account

    private constructor(args: {
        account: Account;
        password?: Password;
        mnemonic?: string;
        pathNumber?: number | null;
    }) {
        this.account = args.account

        this.table = new Table({
            style: {head: ['cyan']},
            head: ['Property', 'Value'],
            colWidths: [15, 70],
            wordWrap: true,
        }) as HorizontalTable

        this.renderAccountProperties()
        if (args.password) {this.table.push(['Password', args.password.value])}
        if (args.mnemonic) {this.table.push(['Mnemonic', args.mnemonic])}
        if (args.pathNumber !== undefined && args.pathNumber !== null) {
            this.table.push([
                'Path',
                // Address paths are 0-based but shown as 1-based to the users
                `Seed wallet n. ${args.pathNumber + 1} (${DerivationService.getPathFromPathNumber(args.pathNumber)})`,
            ])
        }
    }

    public static createFromProfile(profile: Profile, password: Password): AccountCredentialsTable {
        const account = profile.simpleWallet.open(password)
        const mnemonic = profile.encryptedPassphrase
            ? EncryptionService.decrypt(profile.encryptedPassphrase, password) : undefined

        return new AccountCredentialsTable({
            account,
            password,
            mnemonic,
            pathNumber: profile.pathNumber,
        })
    }

    public static createFromAccount(
        account: Account,
        mnemonic?: string,
        pathNumber?: number,
    ): AccountCredentialsTable {
        return new AccountCredentialsTable({account, mnemonic, pathNumber})
    }

     private renderAccountProperties() {
        this.table.push(
            ['Address', this.account.address.pretty()],
            ['Public Key', this.account.publicKey],
            ['Private Key', this.account.privateKey],
        )
    }

    public toString(): string {
        let text = ''
        text += '\n' + chalk.green('Account') + '\n'
        text += this.table.toString()
        return text
    }
}

/**
 * Base command class to create a new profile.
 */
export abstract class CreateProfileCommand extends Command {
    public spinner = new Spinner('processing.. %s')
    private readonly profileRepository: ProfileRepository
    private readonly profileService: ProfileService

    /**
     * Constructor.
     */
    protected constructor(fileUrl?: string) {
        super()
        this.profileRepository = new ProfileRepository(fileUrl || '.symbolrc.json')
        this.profileService = new ProfileService(this.profileRepository)
        this.spinner.setSpinnerString('|/-\\')
    }

    /**
     * Creates a new profile.
     * @protected
     * @param {ProfileCreation} Profile creation arguments
     * @returns {Profile}
     */
    protected createProfile(args: ProfileCreation): Profile {
        try {
            const profile = args.importType === ImportType.PrivateKey
                ? Profile.createFromPrivateKey(args as PrivateKeyProfileCreation)
                : Profile.createFromMnemonic(args as HDProfileCreation)

            this.profileRepository.save(profile)
            if (args.isDefault) {this.setDefaultProfile(args.name)}
            return profile
        } catch (ignored) {
            console.log('CreateProfileCommand -> createProfile -> ignored', ignored)
            throw new ExpectedError(`The profile [${args.name}] already exists`)
        }
    }

    /**
     * Sets a profile as default.
     * @param {string} profileName - The name of the profile to set as default.
     * @throws {ExpectedError}
     */
    protected setDefaultProfile(profileName: string) {
        try {
            this.profileService.setDefaultProfile(profileName)
        } catch (err) {
            throw new ExpectedError('Can\'t set the profile [' + profileName + '] as the default profile.' +
                'Use \'symbol-cli profile list\' to check whether the profile exist, ' +
                'if not, use \'symbol-cli profile create\' to create a profile')
        }
    }
}

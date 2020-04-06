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
import {CreateProfileOptions} from '../../interfaces/create.profile.command'
import {command, metadata, Command} from 'clime'
import {MnemonicPassPhrase} from 'symbol-hd-wallets'
import chalk from 'chalk'

export class CommandOptions extends CreateProfileOptions {}

@command({
    description: 'Create a new random mnemonic passphrase',
})

export default class extends Command {

    constructor() {
        super()
    }

    @metadata
     async execute() {
        console.log('Use this passphrase to create new profiles \n')
        console.log(chalk.green(MnemonicPassPhrase.createRandom().plain))
    }
}
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
import {command, metadata} from 'clime'

import {AccountCredentialsTable} from '../../interfaces/create.profile.command'
import {EncryptionService} from '../../services/encryption.service'
import {PasswordResolver} from '../../resolvers/password.resolver'
import {ProfileCommand} from '../../interfaces/profile.command'
import {ProfileOptions} from '../../interfaces/profile.options'

@command({
    description: 'View profile credentials',
})
export default class extends ProfileCommand {

    constructor() {
        super()
    }

    @metadata
    async execute(options: ProfileOptions) {
        const profile = this.getProfile(options)
        const password = await new PasswordResolver().resolve(options)

        if (profile.type === 'PrivateKey') {
            const account = profile.decrypt(password)
            console.log(AccountCredentialsTable.createFromAccount(account).toString())
        } else {
            if (!profile.encryptedPassphrase || !profile.pathNumber) {return }
            const account = profile.decrypt(password)
            const mnemonic = EncryptionService.decrypt(profile.encryptedPassphrase, password)
            const {pathNumber} = profile

            console.log(AccountCredentialsTable.createFromAccount(
                account, mnemonic, pathNumber,
            ).toString())
        }
    }
}

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

import {account1, account2, account3} from '../accounts.mock'
import {Deadline, MultisigAccountModificationTransaction, NetworkType} from 'symbol-sdk'

export const unsignedMultisigAccountModification1 = MultisigAccountModificationTransaction.create(
 Deadline.create(),
 2,
 1,
 [
  account1.publicAccount,
  account2.publicAccount,
 ],
 [account3.publicAccount],
 NetworkType.MIJIN_TEST,
)
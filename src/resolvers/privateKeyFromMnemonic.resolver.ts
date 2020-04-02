import {OptionsResolver} from '../options-resolver'
import {MnemonicPassphraseValidator} from '../validators/mnemonicPassphrase.validator'
import {Resolver} from './resolver'
import {PathNumberResolver} from './pathNumber.resolver'
import {MnemonicPassPhrase, ExtendedKey, Wallet} from 'symbol-hd-wallets'

/**
 * Private key resolver from mnemonic
 */
export class PrivateKeyFromMnemonicResolver implements Resolver {

    /**
     * Resolves a private key provided by the user.
     * @param {Options} options - Command options.
     * @param {string} altText - Alternative text.
     * @param {string} altKey - Alternative key.
     * @returns {Promise<string>}
     */
    async resolve(): Promise<string> {
        const mnemonic = await OptionsResolver(
            {},
            'privateKey',
            () => undefined,
            'Enter a mnemonic:',
            'password',
            new MnemonicPassphraseValidator(),
        )

        const pathNumber = await new PathNumberResolver().resolve()
        const path = `m/44'/4343'/${pathNumber}'/0'/0'`

        const seed = new MnemonicPassPhrase(mnemonic).toSeed().toString('hex')
        const extendedKey = ExtendedKey.createFromSeed(seed)
        const wallet = new Wallet(extendedKey).getChildAccount(path)
        return wallet.privateKey
    }
}

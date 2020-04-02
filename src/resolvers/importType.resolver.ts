import {OptionsChoiceResolver} from '../options-resolver'
import {Resolver} from './resolver'
import {ImportType} from '../models/importType.enum'
import {CreateProfileOptions} from '../interfaces/create.profile.command'

/**
 * Import type resolver
 */
export class ImportTypeResolver implements Resolver {

    /**
     * Resolves an import type provided by the user.
     * @param {CreateProfileOptions} options - Command options.
     * @param {string} altText - Alternative text.
     * @param {string} altKey - Alternative key.
     * @returns {Promise<number>}
     */
    async resolve(options: CreateProfileOptions, altText?: string, altKey?: string): Promise<number> {
        if (options['private-key']) {return ImportType.PrivateKey}
        if (options.mnemonic) {return ImportType.Mnemonic}

        const choices = Object
            .keys(ImportType)
            .filter((key) => Number.isNaN(parseFloat(key)))
            .map((string) => ({
                title: string,
                value: ImportType[string as any],
            }))

        const value = +(await OptionsChoiceResolver(options,
            altKey ? altKey : 'importType',
            altText ? altText : 'Select an import type:',
            choices,
            'select',
            undefined,
        ))
        return value
    }
}

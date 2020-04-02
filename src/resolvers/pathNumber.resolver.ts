import {OptionsChoiceResolver} from '../options-resolver'
import {Resolver} from './resolver'

/**
 * Path number resolver
 */
export class PathNumberResolver implements Resolver {

    /**
     * Resolves a path number provided by the user.
     * @returns {Promise<number>}
     */
    async resolve(): Promise<number> {
        const choices = [...Array(10).keys()]
            .map((key) => ({
                // Index is shown as 1-based to match with other wallets UX
                title: `${key+ 1}`,
                value: key,
            }))

        console.log('PathNumberResolver -> choices', choices)

        const value = +(await OptionsChoiceResolver({},
            'pathNumber',
            'Select the child account number:',
            choices,
            'select',
            undefined,
        ))
        return value
    }
}

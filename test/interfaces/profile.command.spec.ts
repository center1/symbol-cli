import {expect} from 'chai'
import * as fs from 'fs'

import {mockProfile1} from '../mocks/profiles/profile.mock'
import {ProfileCommand} from '../../src/interfaces/profile.command'
import {ProfileRepository} from '../../src/respositories/profile.repository'

describe('Profile Command', () => {
    let repositoryFileUrl: string
    let command: ProfileCommand

    class StubCommand extends ProfileCommand {
        constructor() {
            super(repositoryFileUrl)
        }

        execute(...args: any[]) {
            throw new Error('Method not implemented.')
        }
    }

    const removeAccountsFile = () => {
        const file = (process.env.HOME || process.env.USERPROFILE) + '/' + repositoryFileUrl
        if (fs.existsSync(file)) {
            fs.unlinkSync(file)
        }
    }

    before(() => {
        removeAccountsFile()
        repositoryFileUrl = '.symbolrctest.json'
        command = new StubCommand()
    })

    beforeEach(() => {
        removeAccountsFile()
    })

    after(() => {
        removeAccountsFile()
    })

    it('repository url should be overwritten', () => {
        expect(command['profileService']['profileRepository']['fileUrl']).to.equal(repositoryFileUrl)
    })

    it('should get a new profile', () => {
        new ProfileRepository(repositoryFileUrl).save(mockProfile1)
        const options = {profile: mockProfile1.name}
        const profile = command['getProfile'](options)
        expect(profile.name).to.equal(mockProfile1.name)
    })

    it('should not get a profile that does not exist', () => {
        const options = {profile: 'random'}
        expect(() => command['getProfile'](options))
            .to.throws(Error)
    })

    it('should get a profile saved as default', () => {
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        profileRepository.save(mockProfile1)
        profileRepository.setDefault(mockProfile1.name)
        const profile = command['getDefaultProfile']()
        expect(profile.name).to.be.equal(mockProfile1.name)
    })

    it('should throw error if trying to retrieve a default profile that does not exist', () => {
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        profileRepository.save(mockProfile1)
        console.log('mockProfile1', mockProfile1)
        expect(() => command['getDefaultProfile']()).to.throws(Error)
    })

    it('should get all  saved profiles', () => {
        const profileRepository = new ProfileRepository(repositoryFileUrl)
        profileRepository.save(mockProfile1)
        const profile = command['findAllProfiles']()[0]
        expect(profile.name).to.be.equal(mockProfile1.name)
    })
})

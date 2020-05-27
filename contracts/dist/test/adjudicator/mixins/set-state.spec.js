"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const utils_1 = require("@connext/utils");
const constants_1 = require("ethers/constants");
const ethers_1 = require("ethers");
const utils_2 = require("../utils");
const AppWithAction_json_1 = __importDefault(require("../../../build/AppWithAction.json"));
const ChallengeRegistry_json_1 = __importDefault(require("../../../build/ChallengeRegistry.json"));
describe("setState", () => {
    let wallet;
    let snapshotId;
    let bob;
    let appRegistry;
    let appDefinition;
    let ONCHAIN_CHALLENGE_TIMEOUT;
    let appInstance;
    let setState;
    let verifyChallenge;
    let verifyEmptyChallenge;
    before(async () => {
        wallet = (await utils_2.provider.getWallets())[0];
        await wallet.getTransactionCount();
        appRegistry = await new ethers_1.ContractFactory(ChallengeRegistry_json_1.default.abi, ChallengeRegistry_json_1.default.bytecode, wallet).deploy();
        appDefinition = await new ethers_1.ContractFactory(AppWithAction_json_1.default.abi, AppWithAction_json_1.default.bytecode, wallet).deploy();
    });
    beforeEach(async () => {
        snapshotId = await utils_2.snapshot();
        const context = await utils_2.setupContext(appRegistry, appDefinition);
        setState = context["setState"];
        verifyChallenge = context["verifyChallenge"];
        verifyEmptyChallenge = context["verifyEmptyChallenge"];
        ONCHAIN_CHALLENGE_TIMEOUT = context["ONCHAIN_CHALLENGE_TIMEOUT"];
        appInstance = context["appInstance"];
        bob = context["bob"];
    });
    afterEach(async () => {
        await utils_2.restore(snapshotId);
    });
    describe("setState", () => {
        it("should work when a challenge is submitted for the first time", async () => {
            await verifyEmptyChallenge();
            const versionNumber = 3;
            const state = utils_2.randomState();
            const timeout = 4;
            await setState(versionNumber, state, timeout);
            await verifyChallenge({
                status: types_1.ChallengeStatus.IN_DISPUTE,
                appStateHash: utils_2.appStateToHash(state),
                versionNumber: utils_1.toBN(versionNumber),
                finalizesAt: utils_1.toBN((await utils_2.provider.getBlockNumber()) + timeout),
            });
        });
        it("should work when a challenge with a higher version number is submmitted", async () => {
            const versionNumber = 3;
            const state = utils_2.randomState();
            const timeout = 4;
            await setState(versionNumber, state, timeout);
            await verifyChallenge({
                status: types_1.ChallengeStatus.IN_DISPUTE,
                appStateHash: utils_2.appStateToHash(state),
                versionNumber: utils_1.toBN(versionNumber),
                finalizesAt: utils_1.toBN((await utils_2.provider.getBlockNumber()) + timeout),
            });
            const newVersionNumber = 10;
            const newState = utils_2.randomState();
            const newTimeout = 2;
            await setState(newVersionNumber, newState, newTimeout);
            await verifyChallenge({
                status: types_1.ChallengeStatus.IN_DISPUTE,
                appStateHash: utils_2.appStateToHash(newState),
                versionNumber: utils_1.toBN(newVersionNumber),
                finalizesAt: utils_1.toBN((await utils_2.provider.getBlockNumber()) + newTimeout),
            });
        });
        it("fails if not disputable", async () => {
            const state = utils_2.randomState();
            await setState(1, state);
            await verifyChallenge({
                status: types_1.ChallengeStatus.IN_DISPUTE,
                appStateHash: utils_2.appStateToHash(state),
                versionNumber: utils_1.toBN(1),
            });
            await utils_2.moveToBlock(100);
            await utils_2.expect(setState(2, utils_2.randomState())).to.be.revertedWith("setState was called on an app that cannot be disputed anymore");
        });
        it("fails if incorrect signers", async () => {
            const state = utils_2.randomState();
            const thingToSign = utils_2.computeAppChallengeHash(appInstance.identityHash, utils_2.appStateToHash(state), 1, ONCHAIN_CHALLENGE_TIMEOUT);
            await utils_2.expect(appRegistry.functions.setState(appInstance.appIdentity, {
                versionNumber: constants_1.One,
                appStateHash: utils_2.appStateToHash(state),
                timeout: ONCHAIN_CHALLENGE_TIMEOUT,
                signatures: await utils_2.sortSignaturesBySignerAddress(thingToSign, [
                    await (new utils_1.ChannelSigner(wallet.privateKey).signMessage(thingToSign)),
                    await (new utils_1.ChannelSigner(bob.privateKey).signMessage(thingToSign)),
                ]),
            })).to.be.revertedWith(`Invalid signature`);
        });
        it("fails if called with the same versioned state", async () => {
            const state = utils_2.randomState();
            await setState(1, state);
            await verifyChallenge({
                status: types_1.ChallengeStatus.IN_DISPUTE,
                appStateHash: utils_2.appStateToHash(state),
                versionNumber: utils_1.toBN(1),
            });
            await utils_2.expect(setState(1, state)).to.be.revertedWith("setState was called with outdated state");
        });
        it("fails if called with a stale state", async () => {
            const state = utils_2.randomState();
            await setState(20, state);
            await verifyChallenge({
                status: types_1.ChallengeStatus.IN_DISPUTE,
                appStateHash: utils_2.appStateToHash(state),
                versionNumber: utils_1.toBN(20),
            });
            await utils_2.expect(setState(1, state)).to.be.revertedWith("setState was called with outdated state");
        });
    });
});
//# sourceMappingURL=set-state.spec.js.map
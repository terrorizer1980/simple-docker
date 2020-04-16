"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@connext/utils");
const ethers_1 = require("ethers");
const constants_1 = require("ethers/constants");
const utils_2 = require("ethers/utils");
const index_1 = require("./index");
const utils_3 = require("../../utils");
exports.setupContext = async (appRegistry, appDefinition, providedWallet) => {
    const alice = new ethers_1.Wallet("0x3570f77380e22f8dc2274d8fd33e7830cc2d29cf76804e8c21f4f7a6cc571d27");
    const bob = new ethers_1.Wallet("0x4ccac8b1e81fb18a98bbaf29b9bfe307885561f71b76bd4680d7aec9d0ddfcfd");
    const ONCHAIN_CHALLENGE_TIMEOUT = 30;
    const DEFAULT_TIMEOUT = 10;
    const CHANNEL_NONCE = parseInt((Math.random() * 100).toString().split(".")[0]);
    const multisigAddress = utils_1.createRandomAddress();
    const appInstance = new index_1.AppWithCounterClass([alice.address, bob.address], multisigAddress, appDefinition.address, DEFAULT_TIMEOUT, CHANNEL_NONCE);
    const getChallenge = async () => {
        const [status, appStateHash, versionNumber, finalizesAt,] = await appRegistry.functions.getAppChallenge(appInstance.identityHash);
        return {
            status,
            appStateHash,
            versionNumber,
            finalizesAt,
        };
    };
    const getOutcome = async () => {
        const outcome = await appRegistry.functions.getOutcome(appInstance.identityHash);
        return outcome;
    };
    const verifyChallenge = async (expected) => {
        const challenge = await getChallenge();
        index_1.expect(challenge).to.containSubset(expected);
    };
    const isProgressable = async () => {
        const challenge = await getChallenge();
        return await appRegistry.functions.isProgressable(challenge, appInstance.defaultTimeout);
    };
    const isDisputable = async (challenge) => {
        if (!challenge) {
            challenge = await getChallenge();
        }
        return await appRegistry.functions.isDisputable(challenge);
    };
    const isFinalized = async () => {
        const challenge = await getChallenge();
        return await appRegistry.functions.isFinalized(challenge, appInstance.defaultTimeout);
    };
    const isCancellable = async (challenge) => {
        if (!challenge) {
            challenge = await getChallenge();
        }
        return appRegistry.functions.isCancellable(challenge, appInstance.defaultTimeout);
    };
    const hasPassed = (timeout) => {
        return appRegistry.functions.hasPassed(utils_1.toBN(timeout));
    };
    const verifySignatures = async (digest = utils_1.createRandom32ByteHexString(), signatures, signers) => {
        if (!signatures) {
            signatures = await utils_3.sortSignaturesBySignerAddress(digest, [
                await (new utils_1.ChannelSigner(bob.privateKey).signMessage(digest)),
                await (new utils_1.ChannelSigner(alice.privateKey).signMessage(digest)),
            ]);
        }
        if (!signers) {
            signers = [alice.address, bob.address];
        }
        return appRegistry.functions.verifySignatures(signatures, digest, signers);
    };
    const wrapInEventVerification = async (contractCall, expected = {}) => {
        const { status, appStateHash, finalizesAt, versionNumber } = await getChallenge();
        await index_1.expect(contractCall)
            .to.emit(appRegistry, "ChallengeUpdated")
            .withArgs(appInstance.identityHash, expected.status || status, expected.appStateHash || appStateHash, expected.versionNumber || versionNumber, expected.finalizesAt || finalizesAt);
    };
    const setOutcome = async (encodedFinalState) => {
        await wrapInEventVerification(appRegistry.functions.setOutcome(appInstance.appIdentity, encodedFinalState || constants_1.HashZero), { status: 4 });
    };
    const setOutcomeAndVerify = async (encodedFinalState) => {
        await setOutcome(encodedFinalState);
        const outcome = await getOutcome();
        index_1.expect(outcome).to.eq(index_1.encodeOutcome());
        await verifyChallenge({ status: 4 });
    };
    const setState = async (versionNumber, appState, timeout = ONCHAIN_CHALLENGE_TIMEOUT) => {
        const stateHash = utils_2.keccak256(appState || constants_1.HashZero);
        const digest = index_1.computeAppChallengeHash(appInstance.identityHash, stateHash, versionNumber, timeout);
        const call = appRegistry.functions.setState(appInstance.appIdentity, {
            versionNumber,
            appStateHash: stateHash,
            timeout,
            signatures: await utils_3.sortSignaturesBySignerAddress(digest, [
                await (new utils_1.ChannelSigner(alice.privateKey).signMessage(digest)),
                await (new utils_1.ChannelSigner(bob.privateKey).signMessage(digest)),
            ]),
        });
        await wrapInEventVerification(call, {
            status: 1,
            appStateHash: stateHash,
            versionNumber: utils_1.toBN(versionNumber),
            finalizesAt: utils_1.toBN((await index_1.provider.getBlockNumber()) + timeout + 1),
        });
    };
    const setStateAndVerify = async (versionNumber, appState, timeout = ONCHAIN_CHALLENGE_TIMEOUT) => {
        await setState(versionNumber, appState, timeout);
        await verifyChallenge({
            versionNumber: utils_1.toBN(versionNumber),
            appStateHash: utils_2.keccak256(appState || constants_1.HashZero),
            status: 1,
        });
    };
    const progressState = async (state, action, signer, resultingState, resultingStateVersionNumber, resultingStateTimeout) => {
        const existingChallenge = await getChallenge();
        resultingState = (resultingState !== null && resultingState !== void 0 ? resultingState : {
            counter: action.actionType === index_1.ActionType.ACCEPT_INCREMENT
                ? state.counter
                : state.counter.add(action.increment),
        });
        const resultingStateHash = utils_2.keccak256(index_1.encodeState(resultingState));
        resultingStateVersionNumber = (resultingStateVersionNumber !== null && resultingStateVersionNumber !== void 0 ? resultingStateVersionNumber : existingChallenge.versionNumber.add(constants_1.One));
        resultingStateTimeout = (resultingStateTimeout !== null && resultingStateTimeout !== void 0 ? resultingStateTimeout : 0);
        const digest = index_1.computeAppChallengeHash(appInstance.identityHash, resultingStateHash, resultingStateVersionNumber, resultingStateTimeout);
        const req = {
            appStateHash: resultingStateHash,
            versionNumber: resultingStateVersionNumber,
            timeout: resultingStateTimeout,
            signatures: [await utils_1.signChannelMessage(signer.privateKey, digest)],
        };
        await wrapInEventVerification(appRegistry.functions.progressState(appInstance.appIdentity, req, index_1.encodeState(state), index_1.encodeAction(action)), {
            status: resultingState.counter.gt(5)
                ? 3
                : 2,
            appStateHash: resultingStateHash,
            versionNumber: utils_1.toBN(resultingStateVersionNumber),
            finalizesAt: utils_1.toBN((await index_1.provider.getBlockNumber()) + appInstance.defaultTimeout + 1),
        });
    };
    const progressStateAndVerify = async (state, action, signer = bob) => {
        const existingChallenge = await getChallenge();
        index_1.expect(await isProgressable()).to.be.true;
        const resultingState = {
            counter: action.actionType === index_1.ActionType.ACCEPT_INCREMENT
                ? state.counter
                : state.counter.add(action.increment),
        };
        const resultingStateHash = utils_2.keccak256(index_1.encodeState(resultingState));
        const explicitlyFinalized = resultingState.counter.gt(5);
        const status = explicitlyFinalized
            ? 3
            : 2;
        const expected = {
            appStateHash: resultingStateHash,
            versionNumber: existingChallenge.versionNumber.add(constants_1.One),
            status,
        };
        await progressState(state, action, signer);
        await verifyChallenge(expected);
        index_1.expect(await isProgressable()).to.be.equal(!explicitlyFinalized);
    };
    const setAndProgressStateAndVerify = async (versionNumber, state, action, timeout = 0, turnTaker = bob) => {
        await setAndProgressState(versionNumber, state, action, timeout, turnTaker);
        const resultingState = {
            counter: action.actionType === index_1.ActionType.ACCEPT_INCREMENT
                ? state.counter
                : state.counter.add(action.increment),
        };
        const resultingStateHash = utils_2.keccak256(index_1.encodeState(resultingState));
        const status = resultingState.counter.gt(5)
            ? 3
            : 2;
        await verifyChallenge({
            appStateHash: resultingStateHash,
            versionNumber: constants_1.One.add(versionNumber),
            status,
        });
        index_1.expect(await isProgressable()).to.be.equal(status === 2);
    };
    const setAndProgressState = async (versionNumber, state, action, timeout = 0, turnTaker = bob) => {
        const stateHash = utils_2.keccak256(index_1.encodeState(state));
        const stateDigest = index_1.computeAppChallengeHash(appInstance.identityHash, stateHash, versionNumber, timeout);
        const resultingState = {
            counter: action.actionType === index_1.ActionType.ACCEPT_INCREMENT
                ? state.counter
                : state.counter.add(action.increment),
        };
        const timeout2 = 0;
        const resultingStateHash = utils_2.keccak256(index_1.encodeState(resultingState));
        const resultingStateDigest = index_1.computeAppChallengeHash(appInstance.identityHash, resultingStateHash, constants_1.One.add(versionNumber), timeout2);
        const req1 = {
            versionNumber,
            appStateHash: stateHash,
            timeout,
            signatures: await utils_3.sortSignaturesBySignerAddress(stateDigest, [
                await utils_1.signChannelMessage(alice.privateKey, stateDigest),
                await utils_1.signChannelMessage(bob.privateKey, stateDigest),
            ]),
        };
        const req2 = {
            versionNumber: constants_1.One.add(versionNumber),
            appStateHash: resultingStateHash,
            timeout: timeout2,
            signatures: [await utils_1.signChannelMessage(turnTaker.privateKey, resultingStateDigest)],
        };
        await appRegistry.functions.setAndProgressState(appInstance.appIdentity, req1, req2, index_1.encodeState(state), index_1.encodeAction(action));
    };
    const cancelDispute = async (versionNumber, signatures) => {
        const digest = index_1.computeCancelDisputeHash(appInstance.identityHash, utils_1.toBN(versionNumber));
        if (!signatures) {
            signatures = await utils_3.sortSignaturesBySignerAddress(digest, [
                await (new utils_1.ChannelSigner(alice.privateKey).signMessage(digest)),
                await (new utils_1.ChannelSigner(bob.privateKey).signMessage(digest)),
            ]);
        }
        await appRegistry.functions.cancelDispute(appInstance.appIdentity, {
            versionNumber: utils_1.toBN(versionNumber),
            signatures,
        });
    };
    const cancelDisputeAndVerify = async (versionNumber, signatures) => {
        await cancelDispute(versionNumber, signatures);
        await verifyChallenge(index_1.EMPTY_CHALLENGE);
    };
    return {
        alice,
        bob,
        state0: { counter: constants_1.Zero },
        state1: { counter: utils_1.toBN(2) },
        action: {
            actionType: index_1.ActionType.SUBMIT_COUNTER_INCREMENT,
            increment: utils_1.toBN(2),
        },
        explicitlyFinalizingAction: {
            actionType: index_1.ActionType.SUBMIT_COUNTER_INCREMENT,
            increment: utils_1.toBN(6),
        },
        ONCHAIN_CHALLENGE_TIMEOUT,
        DEFAULT_TIMEOUT,
        appInstance,
        getChallenge,
        verifyChallenge,
        verifyEmptyChallenge: () => verifyChallenge(index_1.EMPTY_CHALLENGE),
        isProgressable,
        isFinalized,
        isCancellable,
        hasPassed,
        isDisputable,
        verifySignatures,
        setOutcome,
        setOutcomeAndVerify,
        setState,
        setStateAndVerify,
        progressState,
        progressStateAndVerify,
        setAndProgressState,
        setAndProgressStateAndVerify,
        cancelDispute,
        cancelDisputeAndVerify,
    };
};
//# sourceMappingURL=context.js.map
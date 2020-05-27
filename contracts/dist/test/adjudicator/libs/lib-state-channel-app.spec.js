"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const utils_1 = require("@connext/utils");
const ethers_1 = require("ethers");
const utils_2 = require("../utils");
const AppWithAction_json_1 = __importDefault(require("../../../build/AppWithAction.json"));
const ChallengeRegistry_json_1 = __importDefault(require("../../../build/ChallengeRegistry.json"));
describe("LibStateChannelApp", () => {
    let appRegistry;
    let appDefinition;
    let wallet;
    let snapshotId;
    let ONCHAIN_CHALLENGE_TIMEOUT;
    let bob;
    let alice;
    let hasPassed;
    let isDisputable;
    let setState;
    let verifyChallenge;
    let setAndProgressState;
    let isProgressable;
    let verifySignatures;
    let isCancellable;
    before(async () => {
        wallet = (await utils_2.provider.getWallets())[0];
        await wallet.getTransactionCount();
        appRegistry = await new ethers_1.ContractFactory(ChallengeRegistry_json_1.default.abi, ChallengeRegistry_json_1.default.bytecode, wallet).deploy();
        appDefinition = await new ethers_1.ContractFactory(AppWithAction_json_1.default.abi, AppWithAction_json_1.default.bytecode, wallet).deploy();
    });
    beforeEach(async () => {
        snapshotId = await utils_2.snapshot();
        const context = await utils_2.setupContext(appRegistry, appDefinition);
        ONCHAIN_CHALLENGE_TIMEOUT = context["ONCHAIN_CHALLENGE_TIMEOUT"];
        bob = context["bob"];
        alice = context["alice"];
        hasPassed = context["hasPassed"];
        isProgressable = context["isProgressable"];
        isCancellable = context["isCancellable"];
        isDisputable = context["isDisputable"];
        setState = context["setStateAndVerify"];
        verifyChallenge = context["verifyChallenge"];
        setAndProgressState =
            (versionNumber, action) => context["setAndProgressStateAndVerify"](versionNumber, context["state0"], action || context["action"]);
        verifySignatures = context["verifySignatures"];
    });
    afterEach(async () => {
        await utils_2.restore(snapshotId);
    });
    describe("hasPassed", () => {
        it("should return true if timeout < curr block", async () => {
            const currBlock = await utils_2.provider.getBlockNumber();
            utils_2.expect(await hasPassed(currBlock - 2)).to.be.true;
        });
        it("should return true if timeout == curr block", async () => {
            const currBlock = await utils_2.provider.getBlockNumber();
            utils_2.expect(await hasPassed(currBlock)).to.be.true;
        });
        it("should return false if timeout > curr block", async () => {
            const currBlock = await utils_2.provider.getBlockNumber();
            utils_2.expect(await hasPassed(currBlock + 10)).to.be.false;
        });
    });
    describe("isDisputable", () => {
        it("should return true for an empty challenge", async () => {
            utils_2.expect(await isDisputable()).to.be.true;
        });
        it("should return true for a challenge IN_DISPUTE phase", async () => {
            await setState(1);
            utils_2.expect(await isDisputable()).to.be.true;
        });
        it("should return false once the IN_DISPUTE phase elapses", async () => {
            await setState(1);
            await utils_2.moveToBlock(45);
            utils_2.expect(await isDisputable()).to.be.false;
        });
        it("should return false if status is not IN_DISPUTE", async () => {
            await setAndProgressState(1);
            utils_2.expect(await isDisputable()).to.be.false;
        });
    });
    describe("isProgressable", () => {
        it("should return true if challenge is in dispute, and the progress state period has not elapsed, but the set state period has", async () => {
            await setState(1);
            await utils_2.moveToBlock(await utils_2.provider.getBlockNumber() + ONCHAIN_CHALLENGE_TIMEOUT + 2);
            utils_2.expect(await isProgressable()).to.be.true;
        });
        it("should return true if challenge is in onchain progression and the progress state period has not elapsed", async () => {
            await setAndProgressState(1);
            await verifyChallenge({
                versionNumber: utils_1.toBN(2),
                status: types_1.ChallengeStatus.IN_ONCHAIN_PROGRESSION,
            });
            await utils_2.moveToBlock(await utils_2.provider.getBlockNumber() + 2);
            utils_2.expect(await isProgressable()).to.be.true;
        });
        it("should return false if progress state period has elapsed", async () => {
            await setAndProgressState(1);
            await utils_2.moveToBlock(await utils_2.provider.getBlockNumber() + 100);
            utils_2.expect(await isProgressable()).to.be.false;
        });
        it("should return false if channel is still in set state period", async () => {
            await setState(1);
            utils_2.expect(await isProgressable()).to.be.false;
        });
        it("should return false for an empty challenge", async () => {
            utils_2.expect(await isProgressable()).to.be.false;
        });
    });
    describe("isCancellable", () => {
        it("should return false if it is set state phase", async () => {
            await setState(1);
            utils_2.expect(await isCancellable()).to.be.false;
        });
        it("should return true if it is state progression phase", async () => {
            await setAndProgressState(1);
            utils_2.expect(await isCancellable()).to.be.true;
        });
        it("should return false if it is explicitly finalized", async () => {
            await setAndProgressState(1, {
                actionType: utils_2.ActionType.SUBMIT_COUNTER_INCREMENT,
                increment: utils_1.toBN(10),
            });
            await verifyChallenge({ status: types_1.ChallengeStatus.EXPLICITLY_FINALIZED });
            utils_2.expect(await isProgressable()).to.be.false;
            utils_2.expect(await isCancellable()).to.be.false;
        });
        it("should return false if the progress state period has elapsed", async () => {
            await setAndProgressState(1);
            await utils_2.moveToBlock(await utils_2.provider.getBlockNumber() + 100);
            utils_2.expect(await isCancellable()).to.be.false;
        });
        it("should return false if there is no challenge", async () => {
            utils_2.expect(await isCancellable()).to.be.false;
        });
    });
    describe("verifySignatures", () => {
        it("should fail if signatures.length !== signers.length", async () => {
            await utils_2.expect(verifySignatures(undefined, undefined, [alice.address])).to.be.revertedWith("Signers and signatures should be of equal length");
        });
        it("should fail if the signers are not sorted", async () => {
            await utils_2.expect(verifySignatures(undefined, undefined, [bob.address, alice.address])).to.be.revertedWith("Invalid signature");
        });
        it("should fail if the signer is invalid", async () => {
            await utils_2.expect(verifySignatures(undefined, undefined, [wallet.address, bob.address])).to.be.revertedWith("Invalid signature");
        });
        it("should work", async () => {
            utils_2.expect(await verifySignatures()).to.be.true;
        });
    });
});
//# sourceMappingURL=lib-state-channel-app.spec.js.map
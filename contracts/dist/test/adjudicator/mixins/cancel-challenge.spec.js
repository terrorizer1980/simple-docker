"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@connext/utils");
const ethers_1 = require("ethers");
const utils_2 = require("../utils");
const AppWithAction_json_1 = __importDefault(require("../../../build/AppWithAction.json"));
const ChallengeRegistry_json_1 = __importDefault(require("../../../build/ChallengeRegistry.json"));
describe("cancelDispute", () => {
    let appRegistry;
    let appDefinition;
    let wallet;
    let snapshotId;
    let appInstance;
    let bob;
    let isDisputable;
    let isProgressable;
    let setState;
    let setAndProgressState;
    let cancelDispute;
    let cancelDisputeAndVerify;
    before(async () => {
        wallet = (await utils_2.provider.getWallets())[0];
        await wallet.getTransactionCount();
        appRegistry = await new ethers_1.ContractFactory(ChallengeRegistry_json_1.default.abi, ChallengeRegistry_json_1.default.bytecode, wallet).deploy();
        appDefinition = await new ethers_1.ContractFactory(AppWithAction_json_1.default.abi, AppWithAction_json_1.default.bytecode, wallet).deploy();
    });
    beforeEach(async () => {
        snapshotId = await utils_2.snapshot();
        const context = await utils_2.setupContext(appRegistry, appDefinition);
        appInstance = context["appInstance"];
        bob = context["bob"];
        isProgressable = context["isProgressable"];
        isDisputable = context["isDisputable"];
        setState = context["setStateAndVerify"];
        setAndProgressState = (versionNumber, state, turnTaker) => context["setAndProgressStateAndVerify"](versionNumber, state || context["state0"], context["action"], undefined, turnTaker || bob);
        cancelDispute = context["cancelDispute"];
        cancelDisputeAndVerify = context["cancelDisputeAndVerify"];
    });
    afterEach(async () => {
        await utils_2.restore(snapshotId);
    });
    it("works", async () => {
        await setAndProgressState(1);
        utils_2.expect(await isProgressable()).to.be.true;
        await cancelDisputeAndVerify(2);
    });
    it("fails if is not cancellable", async () => {
        await utils_2.expect(cancelDispute(0)).to.be.revertedWith("cancelDispute called on challenge that cannot be cancelled");
    });
    it("fails if called in set state phase", async () => {
        await setState(1);
        utils_2.expect(await isDisputable()).to.be.true;
        await utils_2.expect(cancelDispute(1)).to.be.revertedWith("VM Exception while processing transaction: revert cancelDispute called on challenge that cannot be cancelled");
    });
    it("fails if incorrect sigs", async () => {
        const versionNumber = 2;
        await setAndProgressState(versionNumber);
        utils_2.expect(await isProgressable()).to.be.true;
        const digest = utils_2.computeCancelDisputeHash(appInstance.identityHash, utils_1.toBN(versionNumber));
        const signatures = await utils_2.sortSignaturesBySignerAddress(digest, [
            await (new utils_1.ChannelSigner(wallet.privateKey).signMessage(digest)),
            await (new utils_1.ChannelSigner(bob.privateKey).signMessage(digest)),
        ]);
        await utils_2.expect(cancelDispute(versionNumber, signatures)).to.be.revertedWith("Invalid signature");
    });
    it("fails if wrong version number submitted", async () => {
        await setAndProgressState(1);
        utils_2.expect(await isProgressable()).to.be.true;
        await utils_2.expect(cancelDispute(1)).to.be.revertedWith("cancelDispute was called with wrong version number");
    });
});
//# sourceMappingURL=cancel-challenge.spec.js.map
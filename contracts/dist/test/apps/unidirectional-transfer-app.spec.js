"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const constants_1 = require("ethers/constants");
const utils_1 = require("ethers/utils");
const UnidirectionalTransferApp_json_1 = __importDefault(require("../../build/UnidirectionalTransferApp.json"));
const utils_2 = require("../utils");
var AppStage;
(function (AppStage) {
    AppStage[AppStage["POST_FUND"] = 0] = "POST_FUND";
    AppStage[AppStage["MONEY_SENT"] = 1] = "MONEY_SENT";
    AppStage[AppStage["CHANNEL_CLOSED"] = 2] = "CHANNEL_CLOSED";
})(AppStage || (AppStage = {}));
var ActionType;
(function (ActionType) {
    ActionType[ActionType["SEND_MONEY"] = 0] = "SEND_MONEY";
    ActionType[ActionType["END_CHANNEL"] = 1] = "END_CHANNEL";
})(ActionType || (ActionType = {}));
function mkAddress(prefix = "0xa") {
    return utils_1.getAddress(prefix.padEnd(42, "0"));
}
const singleAssetTwoPartyCoinTransferEncoding = `
  tuple(address to, uint256 amount)[2]
`;
const unidirectionalTransferAppStateEncoding = `
  tuple(
    uint8 stage,
    ${singleAssetTwoPartyCoinTransferEncoding} transfers,
    uint256 turnNum,
    bool finalized
  )`;
const unidirectionalTransferAppActionEncoding = `
  tuple(
    uint8 actionType,
    uint256 amount
  )`;
const decodeAppState = (encodedAppState) => utils_1.defaultAbiCoder.decode([unidirectionalTransferAppStateEncoding], encodedAppState)[0];
const encodeAppState = (state) => utils_1.defaultAbiCoder.encode([unidirectionalTransferAppStateEncoding], [state]);
const encodeAppAction = (state) => utils_1.defaultAbiCoder.encode([unidirectionalTransferAppActionEncoding], [state]);
describe("UnidirectionalTransferApp", () => {
    let unidirectionalTransferApp;
    const applyAction = (state, action) => unidirectionalTransferApp.functions.applyAction(encodeAppState(state), encodeAppAction(action));
    const computeOutcome = (state) => unidirectionalTransferApp.functions.computeOutcome(encodeAppState(state));
    before(async () => {
        const wallet = (await utils_2.provider.getWallets())[0];
        unidirectionalTransferApp = await new ethers_1.ContractFactory(UnidirectionalTransferApp_json_1.default.abi, UnidirectionalTransferApp_json_1.default.bytecode, wallet).deploy();
    });
    describe("The applyAction function", () => {
        const initialState = {
            stage: AppStage.POST_FUND,
            transfers: [
                { to: mkAddress("0xa"), amount: constants_1.One.mul(2) },
                { to: mkAddress("0xb"), amount: constants_1.Zero },
            ],
            turnNum: 0,
            finalized: false,
        };
        describe("A valid SEND_MONEY action", () => {
            let newState;
            before(async () => {
                const action = {
                    amount: constants_1.One,
                    actionType: ActionType.SEND_MONEY,
                };
                newState = decodeAppState(await applyAction(initialState, action));
            });
            it("decrements the balance of the sender", async () => {
                const { transfers: [{ amount }], } = newState;
                utils_2.expect(amount).to.eq(constants_1.One);
            });
            it("increments the balance of the recipient", async () => {
                const { transfers: [{}, { amount }], } = newState;
                utils_2.expect(amount).to.eq(constants_1.One);
            });
            it("does not change the addresses of the participants", async () => {
                const { transfers: [{ to: to1 }, { to: to2 }], } = newState;
                utils_2.expect(to1).to.eq(initialState.transfers[0].to);
                utils_2.expect(to2).to.eq(initialState.transfers[1].to);
            });
        });
        it("reverts if the amount is larger than the sender's balance", async () => {
            const action = {
                amount: constants_1.One.mul(3),
                actionType: ActionType.SEND_MONEY,
            };
            await utils_2.expect(applyAction(initialState, action)).to.revertedWith("SafeMath: subtraction overflow");
        });
        it("reverts if given an invalid actionType", async () => {
            const action = {
                amount: constants_1.One,
                actionType: 2,
            };
            await utils_2.expect(applyAction(initialState, action)).to.reverted;
        });
        it("reverts if given a SEND_MONEY action from CHANNEL_CLOSED state", async () => {
            const action = {
                amount: constants_1.One.mul(3),
                actionType: ActionType.SEND_MONEY,
            };
            await utils_2.expect(applyAction(Object.assign(Object.assign({}, initialState), { stage: 2 }), action)).to.revertedWith("Invalid action. Valid actions from MONEY_SENT are {END_CHANNEL}");
        });
        it("can finalize the state by calling END_CHANNEL", async () => {
            const senderAddr = mkAddress("0xa");
            const receiverAddr = mkAddress("0xb");
            const senderAmt = new utils_1.BigNumber(10000);
            const preState = {
                stage: AppStage.POST_FUND,
                transfers: [
                    { to: senderAddr, amount: senderAmt },
                    { to: receiverAddr, amount: constants_1.Zero },
                ],
                turnNum: 0,
                finalized: false,
            };
            const action = {
                actionType: ActionType.END_CHANNEL,
                amount: constants_1.Zero,
            };
            let ret = await applyAction(preState, action);
            const state = decodeAppState(ret);
            utils_2.expect(state.finalized).to.be.true;
            ret = await computeOutcome(state);
            utils_2.expect(ret).to.eq(utils_1.defaultAbiCoder.encode([singleAssetTwoPartyCoinTransferEncoding], [
                [
                    [senderAddr, senderAmt],
                    [receiverAddr, constants_1.Zero],
                ],
            ]));
        });
    });
});
//# sourceMappingURL=unidirectional-transfer-app.spec.js.map
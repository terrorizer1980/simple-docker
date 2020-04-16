"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const utils_1 = require("ethers/utils");
const DolphinCoin_json_1 = __importDefault(require("../../build/DolphinCoin.json"));
const utils_2 = require("../utils");
const DOLPHINCOIN_SUPPLY = utils_1.bigNumberify(10)
    .pow(18)
    .mul(10000);
describe("DolphinCoin (ERC20) can be created", () => {
    let wallet;
    let erc20;
    before(async () => {
        wallet = (await utils_2.provider.getWallets())[0];
        erc20 = await new ethers_1.ContractFactory(DolphinCoin_json_1.default.abi, DolphinCoin_json_1.default.bytecode, wallet).deploy();
    });
    describe("Deployer has all of initial supply", () => {
        it("Initial supply for deployer is DOLPHINCOIN_SUPPLY", async () => {
            utils_2.expect(await erc20.functions.balanceOf(wallet.address)).to.be.eq(DOLPHINCOIN_SUPPLY);
        });
    });
});
//# sourceMappingURL=erc20-example.spec.js.map
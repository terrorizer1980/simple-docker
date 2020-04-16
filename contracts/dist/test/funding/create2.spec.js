"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const utils_1 = require("ethers/utils");
const Echo_json_1 = __importDefault(require("../../build/Echo.json"));
const Proxy_json_1 = __importDefault(require("../../build/Proxy.json"));
const ProxyFactory_json_1 = __importDefault(require("../../build/ProxyFactory.json"));
const utils_2 = require("../utils");
describe("ProxyFactory with CREATE2", function () {
    this.timeout(5000);
    let wallet;
    let pf;
    let echo;
    function create2(initcode, saltNonce = 0, initializer = "0x") {
        return utils_1.getAddress(utils_1.solidityKeccak256(["bytes1", "address", "uint256", "bytes32"], [
            "0xff",
            pf.address,
            utils_1.solidityKeccak256(["bytes32", "uint256"], [utils_1.keccak256(initializer), saltNonce]),
            utils_1.keccak256(initcode),
        ]).slice(-40));
    }
    before(async () => {
        wallet = (await utils_2.provider.getWallets())[0];
        pf = await new ethers_1.ContractFactory(ProxyFactory_json_1.default.abi, ProxyFactory_json_1.default.bytecode, wallet).deploy();
        echo = await new ethers_1.ContractFactory(Echo_json_1.default.abi, Echo_json_1.default.bytecode, wallet).deploy();
    });
    describe("createProxy", async () => {
        it("can be used to deploy a contract at a predictable address", async () => {
            const masterCopy = echo.address;
            const initcode = utils_1.solidityPack(["bytes", "uint256"], [`0x${Proxy_json_1.default.bytecode.replace(/^0x/, "")}`, echo.address]);
            const saltNonce = 0;
            const tx = await pf.createProxyWithNonce(masterCopy, "0x", saltNonce);
            const receipt = await tx.wait();
            const event = receipt.events.pop();
            utils_2.expect(event.event).to.eq("ProxyCreation");
            utils_2.expect(event.eventSignature).to.eq("ProxyCreation(address)");
            utils_2.expect(event.args[0]).to.eq(create2(initcode, saltNonce));
            const echoProxy = new ethers_1.Contract(create2(initcode), Echo_json_1.default.abi, wallet);
            utils_2.expect(await echoProxy.functions.helloWorld()).to.eq("hello world");
        });
    });
});
//# sourceMappingURL=create2.spec.js.map
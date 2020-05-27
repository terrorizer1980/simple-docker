"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const utils_1 = require("@connext/utils");
const utils_2 = require("ethers/utils");
const ChallengeRegistry = __importStar(require("../build/ChallengeRegistry.json"));
const iface = new utils_2.Interface(ChallengeRegistry.abi);
class SetStateCommitment {
    constructor(challengeRegistryAddress, appIdentity, appStateHash, versionNumber, stateTimeout, appIdentityHash = utils_1.appIdentityToHash(appIdentity), initiatorSignature, responderSignature) {
        this.challengeRegistryAddress = challengeRegistryAddress;
        this.appIdentity = appIdentity;
        this.appStateHash = appStateHash;
        this.versionNumber = versionNumber;
        this.stateTimeout = stateTimeout;
        this.appIdentityHash = appIdentityHash;
        this.initiatorSignature = initiatorSignature;
        this.responderSignature = responderSignature;
    }
    get signatures() {
        return [this.initiatorSignature, this.responderSignature];
    }
    async addSignatures(initiatorSignature, responderSignature) {
        this.initiatorSignature = initiatorSignature;
        this.responderSignature = responderSignature;
    }
    set signatures(sigs) {
        throw new Error(`Use "addSignatures" to ensure the correct sorting`);
    }
    encode() {
        return utils_2.solidityPack(["uint8", "bytes32", "bytes32", "uint256", "uint256"], [
            types_1.CommitmentTarget.SET_STATE,
            utils_1.appIdentityToHash(this.appIdentity),
            this.appStateHash,
            this.versionNumber,
            this.stateTimeout,
        ]);
    }
    hashToSign() {
        return utils_2.keccak256(this.encode());
    }
    async getSignedTransaction() {
        await this.assertSignatures();
        return {
            to: this.challengeRegistryAddress,
            value: 0,
            data: iface.functions.setState.encode([
                this.appIdentity,
                await this.getSignedAppChallengeUpdate(),
            ]),
        };
    }
    toJson() {
        return utils_1.deBigNumberifyJson({
            appIdentityHash: this.appIdentityHash,
            appIdentity: this.appIdentity,
            appStateHash: this.appStateHash,
            challengeRegistryAddress: this.challengeRegistryAddress,
            signatures: this.signatures,
            stateTimeout: this.stateTimeout,
            versionNumber: this.versionNumber,
        });
    }
    static fromJson(json) {
        const bnJson = utils_1.bigNumberifyJson(json);
        return new SetStateCommitment(bnJson.challengeRegistryAddress, bnJson.appIdentity, bnJson.appStateHash, bnJson.versionNumber, bnJson.stateTimeout, bnJson.appIdentityHash, bnJson.signatures[0], bnJson.signatures[1]);
    }
    async getSignedAppChallengeUpdate() {
        await this.assertSignatures();
        return {
            appStateHash: this.appStateHash,
            versionNumber: this.versionNumber,
            timeout: this.stateTimeout,
            signatures: this.signatures.filter(x => !!x),
        };
    }
    async assertSignatures() {
        if (!this.signatures || this.signatures.length === 0) {
            throw new Error(`No signatures detected`);
        }
        for (const [idx, sig] of this.signatures.entries()) {
            if (!sig) {
                continue;
            }
            const signer = await utils_1.recoverAddressFromChannelMessage(this.hashToSign(), sig);
            if (signer !== this.appIdentity.participants[idx]) {
                throw new Error(`Got ${signer} and expected ${this.appIdentity.participants[idx]} in set state commitment`);
            }
        }
    }
}
exports.SetStateCommitment = SetStateCommitment;
//# sourceMappingURL=set-state-commitment.js.map
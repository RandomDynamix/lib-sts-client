import axios from 'axios';
import { randomUUID } from "crypto";
import nkeys from 'ts-nkeys';
export class STSClient {
    constructor() {
        this.stsEndpoint = process.env.STS_ENDPOINT || null;
    }
    async requestServiceJWT(nKeySeed, stsEndpoint = this.stsEndpoint) {
        if (!nKeySeed || !stsEndpoint)
            throw 'Missing either nKeySeed or stsEndpoint';
        const nKeyPair = nkeys.fromSeed(Buffer.from(nKeySeed));
        const requestID = randomUUID();
        const initiateResult = await axios.get(`${stsEndpoint}/authorization/session?requestID=${requestID}`);
        if (initiateResult.errors)
            throw initiateResult.errors;
        if (!initiateResult.result.session)
            throw 'No STS Session established';
        const stsRequest = {
            requestID: requestID,
            sessionID: initiateResult.result.session,
            nKeyUser: nKeyPair.getPublicKey(),
        };
        const verificationRequest = {
            request: stsRequest,
            verification: nKeyPair.sign(Buffer.from(JSON.stringify(stsRequest)))
        };
        const verifyResult = await axios.post(`${stsEndpoint}/authorization/verification`, verificationRequest);
        if (verifyResult.errors)
            throw verifyResult.errors;
        if (!verifyResult.result.token)
            throw 'STS Authorization Verification Failed';
        return verifyResult.result.token;
    }
    async requestUserJWT(_namespace, _identity) { }
}

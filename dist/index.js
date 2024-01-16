import fetch from 'node-fetch';
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
        const sessionResponse = await fetch(`${stsEndpoint}/authorization/session?requestID=${requestID}`);
        const sessionJSON = await sessionResponse.json();
        if (!sessionJSON?.session)
            throw 'No STS Session established';
        const stsRequest = {
            requestID: requestID,
            sessionID: sessionJSON.session,
            nKeyUser: nKeyPair.getPublicKey(),
        };
        const verificationRequest = {
            request: stsRequest,
            verification: Buffer.from(nKeyPair.sign(Buffer.from(JSON.stringify(stsRequest)))).toString('base64')
        };
        const verifyPost = {
            method: 'post',
            body: JSON.stringify(verificationRequest),
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        };
        console.log(`VERIFICATION REQUEST: ${JSON.stringify(verificationRequest)}`);
        const verifyReponse = await fetch(`${stsEndpoint}/authorization/verification`, verifyPost);
        const verifyJSON = await verifyReponse.json();
        console.log(`VERIFICATION RESULT: ${JSON.stringify(verifyJSON)}`);
        if (!verifyJSON.token)
            throw 'STS Authorization Verification Failed';
        return verifyJSON.token;
    }
    async requestUserJWT(_namespace, _identity) { }
}

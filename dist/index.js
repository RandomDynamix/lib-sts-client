import axios from 'axios';
import { randomUUID } from "crypto";
import nkeys from 'ts-nkeys';
export class STSClient {
    constructor() {
        this.stsEndpoint = process.env.STS_ENDPOINT || null;
        this.axiosClient = null;
    }
    init(stsEndpoint) {
        if (!stsEndpoint && !this.stsEndpoint)
            throw 'No STSEndpoint provided or configured in environment';
        this.axiosClient = axios.create({ baseURL: (stsEndpoint ?? this.stsEndpoint) });
        if (!this.axiosClient)
            throw 'Error creating axiosClient';
    }
    async requestServiceJWT(nKeySeed, stsEndpoint = this.stsEndpoint) {
        if (!nKeySeed || !stsEndpoint)
            throw 'Missing either nKeySeed or stsEndpoint';
        const nKeyPair = nkeys.fromSeed(Buffer.from(nKeySeed));
        const requestID = randomUUID();
        console.log(`REQUEST ID: ${requestID}`);
        let sessionJSON = await this.requestJSON(`/authorization/session?requestID=${requestID}`);
        if (!sessionJSON)
            throw 'Unable to get response';
        console.log('HERE!');
        console.log(`INITIATE RESULT: ${JSON.stringify(sessionJSON)}`);
        console.log('HERE AGAIN');
        if (!sessionJSON.session)
            throw 'No STS Session established';
        const stsRequest = {
            requestID: requestID,
            sessionID: sessionJSON.session,
            nKeyUser: nKeyPair.getPublicKey(),
        };
        const verificationRequest = {
            request: stsRequest,
            verification: nKeyPair.sign(Buffer.from(JSON.stringify(stsRequest)))
        };
        console.log(`VERIFICATION REQUEST: ${JSON.stringify(verificationRequest)}`);
        const verifyJSON = await this.postJSON(`${stsEndpoint}/authorization/verification`, verificationRequest);
        if (!verifyJSON)
            throw 'Unable to get response';
        console.log(`VERIFICATION RESULT: ${JSON.stringify(verifyJSON)}`);
        if (!verifyJSON.token)
            throw 'STS Authorization Verification Failed';
        return verifyJSON.token;
    }
    async requestUserJWT(_namespace, _identity) { }
    async requestJSON(relativeURL) {
        try {
            if (!this.axiosClient)
                throw 'axiosClient === null';
            const axiosResponse = await this.axiosClient.get(relativeURL, { headers: { 'Accept': 'application/json' } });
            console.log(`axiosResponse: ${JSON.stringify(axiosResponse)}`);
            if (axiosResponse.status > 300)
                throw `HTTP Status code: ${axiosResponse.status}`;
            if (axiosResponse.data.errors)
                throw axiosResponse.data.errors;
            return axiosResponse.data.result;
        }
        catch (err) {
            console.log(`STSClient | requestJSON Error: ${JSON.stringify(err)}`);
        }
        return null;
    }
    async postJSON(relativeURL, postData) {
        try {
            if (!this.axiosClient)
                throw 'axiosClient === null';
            const axiosResponse = await this.axiosClient.post(relativeURL, postData, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } });
            if (axiosResponse.status > 300)
                throw `HTTP Status code: ${axiosResponse.status}`;
            if (axiosResponse.data.errors)
                throw axiosResponse.data.errors;
            return axiosResponse.data.result;
        }
        catch (err) {
            console.log(`STSClient | postJSON Error: ${JSON.stringify(err)}`);
        }
        return null;
    }
}

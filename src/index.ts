import axios, {AxiosInstance, AxiosResponse} from 'axios';
import { randomUUID }                                                 from "crypto";
import nkeys                                                          from 'ts-nkeys';

export class STSClient {
    stsEndpoint: string | null = process.env.STS_ENDPOINT || null;
    axiosClient: AxiosInstance | null = null;

    constructor() {}

    init(stsEndpoint?: string): void {
        if(!stsEndpoint && !this.stsEndpoint) throw 'No STSEndpoint provided or configured in environment';
        this.axiosClient = axios.create({ baseURL: <string>(stsEndpoint ?? this.stsEndpoint) });
        if(!this.axiosClient) throw 'Error creating axiosClient';
    }

    async requestServiceJWT(nKeySeed: string, stsEndpoint: string | null = this.stsEndpoint) {
        //Verify inputs
        if(!nKeySeed || !stsEndpoint) throw 'Missing either nKeySeed or stsEndpoint';

        //Extract the NKey Pair from Seed
        const nKeyPair: any = nkeys.fromSeed(Buffer.from(nKeySeed));

        //Initiate Authorization Session
        const requestID: string = randomUUID();

        //TODO ROD HERE
        console.log(`REQUEST ID: ${requestID}`);

        //let { data } = await axios.get(`${stsEndpoint}/authorization/session?requestID=${requestID}`);
        let sessionJSON: any = await this.requestJSON(`/authorization/session?requestID=${requestID}`);
        if(!sessionJSON) throw 'Unable to get response';

        //TODO ROD HERE
        console.log('HERE!');
        console.log(`INITIATE RESULT: ${JSON.stringify(sessionJSON)}`)
        console.log('HERE AGAIN');

        if(!sessionJSON.session) throw 'No STS Session established';

        //Construct Request & Sign
        const stsRequest = {
            requestID: requestID,
            sessionID: sessionJSON.session,
            nKeyUser: nKeyPair.getPublicKey(),
        };
        const verificationRequest = {
            request: stsRequest,
            verification: nKeyPair.sign(Buffer.from(JSON.stringify(stsRequest)))
        };

        //TODO ROD HERE
        console.log(`VERIFICATION REQUEST: ${JSON.stringify(verificationRequest)}`)

        //Post Authorization Verification
        const verifyJSON: any = await this.postJSON(`${stsEndpoint}/authorization/verification`, verificationRequest);
        if(!verifyJSON) throw 'Unable to get response';

        //TODO ROD HERE
        console.log(`VERIFICATION RESULT: ${JSON.stringify(verifyJSON)}`)

        if(!verifyJSON.token) throw 'STS Authorization Verification Failed';

        return verifyJSON.token;
    }

    async requestUserJWT(_namespace: string, _identity: string) {}

    private async requestJSON(relativeURL: string): Promise<any> {
        try {
            if(!this.axiosClient) throw 'axiosClient === null';
            const axiosResponse: AxiosResponse = await this.axiosClient.get(relativeURL, {headers: {'Accept':'application/json'}});
            if (axiosResponse.status > 300) throw `HTTP Status code: ${axiosResponse.status}`;
            if (axiosResponse.data.errors) throw axiosResponse.data.errors;
            return axiosResponse.data.result;
        } catch(err) {
            console.log(`STSClient | requestJSON Error: ${JSON.stringify(err)}`);
        }
        return null;
    }
    private async postJSON(relativeURL: string, postData: any): Promise<any> {
        try {
            if(!this.axiosClient) throw 'axiosClient === null';
            const axiosResponse: AxiosResponse = await this.axiosClient.post(relativeURL, postData,{headers: {'Content-Type':'application/json','Accept':'application/json'}});
            if (axiosResponse.status > 300) throw `HTTP Status code: ${axiosResponse.status}`;
            if (axiosResponse.data.errors) throw axiosResponse.data.errors;
            return axiosResponse.data.result;
        } catch(err) {
                console.log(`STSClient | postJSON Error: ${JSON.stringify(err)}`);
            }
            return null;
        }
}



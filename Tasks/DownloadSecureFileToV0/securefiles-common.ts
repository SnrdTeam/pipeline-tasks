import * as fs from 'fs';
import * as Q from 'q';
import * as tl from 'azure-pipelines-task-lib/task';
import { getPersonalAccessTokenHandler, WebApi } from 'azure-devops-node-api';
import { IRequestOptions } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces";

export class SecureFileHelpers {
    serverConnection: WebApi;

    constructor() {
        const serverUrl: string = tl.getVariable('System.TeamFoundationCollectionUri');
        const serverCreds: string = tl.getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'ACCESSTOKEN', false);
        const authHandler = getPersonalAccessTokenHandler(serverCreds);

        const proxy = tl.getHttpProxyConfiguration();
        let options: IRequestOptions = {
            allowRetries: true,
            maxRetries: 5
        };

        if (proxy) {
            options = { ...options, proxy, ignoreSslError: true };
        };

        this.serverConnection = new WebApi(serverUrl, authHandler, options);
    }

    /**
     * Download secure file contents to a temporary location for the build
     * @param secureFileId Secure file id.
     * @param secureFilePath Secure file path save to.
     */
    async downloadSecureFile(secureFileId: string, secureFilePath: string): Promise<void> {        
        tl.debug('Downloading secure file contents to: ' + secureFilePath);
        const file: NodeJS.WritableStream = fs.createWriteStream(secureFilePath);

        const agentApi = await this.serverConnection.getTaskAgentApi();

        const ticket = tl.getSecureFileTicket(secureFileId);
        if (!ticket) {
            // Workaround bug #7491. tl.loc only works if the consuming tasks define the resource string.
            throw new Error(`Download ticket for SecureFileId ${secureFileId} not found.`);
        }

        const stream = (await agentApi.downloadSecureFile(
            tl.getVariable('SYSTEM.TEAMPROJECT'), secureFileId, ticket, false)).pipe(file);

        const defer = Q.defer();
        stream.on('finish', () => {
            defer.resolve();
        });
        await defer.promise;
        tl.debug('Downloaded secure file contents to: ' + secureFilePath);
    }
}

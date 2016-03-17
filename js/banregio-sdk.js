banregio = {};

banregio.api = function() {
    var host, clientId, clientSecret, redirectUri,
        accessToken, refreshToken, scope,
        self = this,
        storage = sessionStorage,
        sessionKey = 'banregio_api',
        version = 'application/vnd.banregio-v0.0.beta1+json',
        endpoints = {
            authorize: 'oauth/authorize',
            token: 'oauth/token/',
            v1accounts: 'api/v1/accounts/',
            v1transactions: 'api/v1/accounts/{}/transactions/',
            accounts: 'accounts/',
            transactions: 'api/v1/accounts/{}/transactions/',
            targetaccounts: 'api/v1/targetaccounts/',
            transfer: 'api/v1/accounts/{}/ptransfers/'
        }, getParameterByName, removeURLParameter, detectOAuthRedirect, saveTokenData,
        onLogin, onLogout, apiRequest;

    getParameterByName = function(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    this.config = function(cfg) {
        host = cfg.config.host;
        clientId = cfg.config.clientId;
        clientSecret = cfg.config.clientSecret;
        redirectUri = cfg.config.redirectUri;

        onLogin = cfg.onLogin;
        onLogout = cfg.onLogout;

        if(!detectOAuthRedirect.apply(banregio.api, [])) 
            detectSessionData.apply(banregio.api, []);

        this.config = null;
    };

    detectOAuthRedirect = function() {
        var error = getParameterByName('error');
        var code = getParameterByName('code');

        if(code) this.getAccessToken(code);
        else if(error) console.error('oAuth error', error);
        else return false;

        return true;
    };

    detectSessionData = function() {
        var sessionData = storage.getItem(sessionKey);

        if(sessionData)
            saveTokenData(JSON.parse(sessionData));
    };

    this.login = function() {
        var buildLoginUri = function() {
            return host 
                + endpoints.authorize 
                + '?response_type=code'
                + '&client_id=' + clientId
                + '&redirect_uri=' + redirectUri;
        };

        location.href = buildLoginUri();
    };

    this.logout = function() {
        removeTokenData();
    };

    this.getTarAccUri = function() {
        var buildTarAccUri = function() {
            return host 
                + 'transfer/cuentasdestino/agregar/'
                + '?response_type=code'
                + '&client_id=' + clientId
                + '&redirect_uri=' + redirectUri;
        };

        location.href = buildTarAccUri();
    };

    this.getAccessToken = function(code) {
        $.post(host + endpoints.token, {
            grant_type: 'authorization_code',
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
        })
        .done(function(data) {
            saveTokenData(data);
        })
        .fail(function() {
            console.error('Error getting access token');
        });
    };

    this.refreshAccessToken = function() {
        $.post(host + endpoints.token, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret
        })
        .done(function(data) {
            saveTokenData(data);
        })
        .fail(function() {
            console.error('Error refreshing access token');
        });
    };

    saveTokenData = function(data) {
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        scope = data.scope;
        storage.setItem(sessionKey, JSON.stringify(data));
        onLogin.apply(onLogin, []);
    };

    removeTokenData = function() {
        accessToken = refreshToken = scope = '';
        storage.removeItem(sessionKey);
        onLogout.apply(onLogout, []);
    };

    apiRequest = function(endpoint, method, data) {
        console.log(endpoint);
        var ajaxCall = {
            url:host + endpoint,
            type: method,
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Accept': version
            }
        };

        if(data != null) {
            ajaxCall.processData =  false;
            ajaxCall.data = JSON.stringify(data);
        }
        console.log(ajaxCall);

        return $.ajax(ajaxCall);
    };

    this.addAccount = function(accountType, clientNumber, last4Digits, pin) {
        return apiRequest(endpoints.v1accounts, 'POST', {    
            /*numerocliente: clientNumber,
            last_4_digits: last4Digits,
            nip: pin*/ 
            type: accountType,
            client: {
                number: clientNumber
            },
            card: {
                last_4_digits: last4Digits,
                pin: pin
            }          
        });
    };

    this.getAccounts = function() {
        return apiRequest(endpoints.v1accounts, 'GET', null);
    };

    this.getTargetAccounts = function() {
        return apiRequest(endpoints.targetaccounts, 'GET', null);
    };

    this.getTargetAccount = function(taccountId, monto){
        console.log(taccountId);
        console.log(monto);
        return apiRequest(
            endpoints.targetaccounts + taccountId + '/?amount=' + monto, 
            'GET', null);
    };

    this.getAccount = function(accountId){
        console.log(accountId);
        return apiRequest(endpoints.v1accounts + accountId + '/', 'GET', null);
    };

    this.cancelTransfer = function(transferId, accountId){
        return apiRequest(endpoints.transfer.replace('{}', accountId) + transferId + '/', 'PUT', null);
    }; 

    this.deleteAccount = function(accountId){
        return apiRequest(endpoints.v1accounts + accountId + '/', 'DELETE', null);
    }; 

    this.deleteTargetAccount = function(taccountId){
        return apiRequest(endpoints.targetaccounts + taccountId + '/', 'DELETE', null);
    }; 

    this.postTransfer = function(accountId, targetaccount, tiposolicitud, cantidad, concepto, tipotransferencia, frecuencia, fechaprimerenvio, tipoduracion, duraciontransferencia, duracionfecha, diasanterioresenviomail, token){
        return apiRequest(endpoints.transfer.replace('{}', accountId), 'POST', {   
            targetaccount: targetaccount,
            tiposolicitud: tiposolicitud,
            cantidad: cantidad,
            concepto: concepto,
            tipotransferencia: tipotransferencia,
            frecuencia: frecuencia,
            fechaprimerenvio: fechaprimerenvio,
            tipoduracion: tipoduracion,
            duraciontransferencia: duraciontransferencia,
            duracionfecha: duracionfecha,
            //diasanterioresenviomail: diasanterioresenviomail,
            token: token        
        });
    }; 

    this.getTransactions = function(accountId, mindate, maxdate) {
        return apiRequest(
            endpoints.v1transactions.replace('{}', accountId) + '?min_date=' + mindate + '&max_date=' + maxdate,
            'GET',
            null
        );
    };

    this.getTransfers = function(accountId) {
        return apiRequest(
            endpoints.transfer.replace('{}', accountId),
            'GET',
            null
        );
    };

    return this;
};

banregio.api.init = function(cfg) {
    $(function() {
        banregio.api.apply(banregio.api, []);
        banregio.api.config.apply(banregio.api, [cfg]);
    }); 
};
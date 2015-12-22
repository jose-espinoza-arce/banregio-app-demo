# banregio-js
This SDK requires jQuery.

    <script src="jquery-2.1.3.min.js"></script>
    <script src="banregio-sdk.js"></script>

Initialize:

    banregio.api.init({
        config: {
            host: 'https://api.banregio.com/',
            clientId: '<client_id>',
            clientSecret: '<client_secret>',
            redirectUri: '<redirect_uri>'
        },
        onLogin: function() {
            console.log('Logged in');
        },
        onLogout: function() {
            console.log('Logged out');
        }
    });
    

There are two possible values for the host parameter:
- https://sandbox.banregio.com/ for development
- https://api.banregio.com/ for production

Login:

    banregio.api.login();

Associate a new bank account:

    banregio.api.addAccount('<bank_client_id>', '<last_4_card_digits>', '<pin>')
      .done(function(data) {
        console.log(data.account);
      })
      .fail(function() {
        console.log('Error while adding a new account');
      });

Get list of bank accounts:

    banregio.api.getAccounts(<account_id>)
      .done(function(data) {
        console.log(data.transactions);
      })
      .fail(function() {
        console.log('Error while retrieving bank account transactions');
      });

Get list of bank account transactions:

    banregio.api.getAccounts()
      .done(function(data) {
        console.log(data.accounts);
      })
      .fail(function() {
        console.log('Error while retrieving bank accounts');
      });

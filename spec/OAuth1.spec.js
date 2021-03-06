var OAuth = require("../src/Adapters/Auth/OAuth1Client");

describe('OAuth', function() {
  it("Nonce should have right length", (done) => {
    jequal(OAuth.nonce().length, 30);
    done();
  });

  it("Should properly build parameter string", (done) => {
    var string = OAuth.buildParameterString({c:1, a:2, b:3})
    jequal(string, "a=2&b=3&c=1");
    done();
  });

  it("Should properly build empty parameter string", (done) => {
    var string = OAuth.buildParameterString()
    jequal(string, "");
    done();
  });

  it("Should properly build signature string", (done) => {
    var string = OAuth.buildSignatureString("get", "http://dummy.com", "");
    jequal(string, "GET&http%3A%2F%2Fdummy.com&");
    done();
  });

  it("Should properly generate request signature", (done) => {
    var request = {
      host: "dummy.com",
      path: "path"
    };

    var oauth_params = {
      oauth_timestamp: 123450000,
      oauth_nonce: "AAAAAAAAAAAAAAAAA",
      oauth_consumer_key: "hello",
      oauth_token: "token"
    };

    var consumer_secret = "world";
    var auth_token_secret = "secret";
    request = OAuth.signRequest(request, oauth_params, consumer_secret, auth_token_secret);
    jequal(request.headers['Authorization'], 'OAuth oauth_consumer_key="hello", oauth_nonce="AAAAAAAAAAAAAAAAA", oauth_signature="8K95bpQcDi9Nd2GkhumTVcw4%2BXw%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="123450000", oauth_token="token", oauth_version="1.0"');
    done();
  });

  it("Should properly build request", (done) => {
    var options = {
      host: "dummy.com",
      consumer_key: "hello",
      consumer_secret: "world",
      auth_token: "token",
      auth_token_secret: "secret",
      // Custom oauth params for tests
      oauth_params: {
        oauth_timestamp: 123450000,
        oauth_nonce: "AAAAAAAAAAAAAAAAA"
      }
    };
    var path = "path";
    var method = "get";

    var oauthClient = new OAuth(options);
    var req = oauthClient.buildRequest(method, path, {"query": "param"});

    jequal(req.host, options.host);
    jequal(req.path, "/" + path + "?query=param");
    jequal(req.method, "GET");
    jequal(req.headers['Content-Type'], 'application/x-www-form-urlencoded');
    jequal(req.headers['Authorization'], 'OAuth oauth_consumer_key="hello", oauth_nonce="AAAAAAAAAAAAAAAAA", oauth_signature="wNkyEkDE%2F0JZ2idmqyrgHdvC0rs%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="123450000", oauth_token="token", oauth_version="1.0"')
    done();
  });


  function validateCannotAuthenticateError(data, done) {
    jequal(typeof data, "object");
    jequal(typeof data.errors, "object");
    var errors = data.errors;
    jequal(typeof errors[0], "object");
    // Cannot authenticate error
    jequal(errors[0].code, 32);
    done();
  }

  it("Should fail a GET request", (done) => {
    var options = {
      host: "api.twitter.com",
      consumer_key: "XXXXXXXXXXXXXXXXXXXXXXXXX",
      consumer_secret: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    };
    var path = "/1.1/help/configuration.json";
    var params = {"lang": "en"};
    var oauthClient = new OAuth(options);
    oauthClient.get(path, params).then(function(data){
      validateCannotAuthenticateError(data, done);
    })
  });

  it("Should fail a POST request", (done) => {
    var options = {
      host: "api.twitter.com",
      consumer_key: "XXXXXXXXXXXXXXXXXXXXXXXXX",
      consumer_secret: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    };
    var body = {
      lang: "en"
    };
    var path = "/1.1/account/settings.json";

    var oauthClient = new OAuth(options);
    oauthClient.post(path, null, body).then(function(data){
      validateCannotAuthenticateError(data, done);
    })
  });

  it("Should fail a request", (done) => {
    var options = {
      host: "localhost",
      consumer_key: "XXXXXXXXXXXXXXXXXXXXXXXXX",
      consumer_secret: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    };
    var body = {
      lang: "en"
    };
    var path = "/";

    var oauthClient = new OAuth(options);
    oauthClient.post(path, null, body).then(function(){
      jequal(false, true);
      done();
    }).catch(function(){
      jequal(true, true);
      done();
    })
  });
});

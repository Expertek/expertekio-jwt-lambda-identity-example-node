# Example AWS API Gateway Lambda Handler in Node.JS using expertek.io JWT Authorization

This is an example AWS Lambda Handler for use with API Gateway that demonstrates how to authorize
using an expertek.io JSON web token (JWT). Note that in this handler the authorization is embedded,
as opposed to configuration a Lambda Authorizer in API Gateway (for more on that, see the 
[sample API gateway authorizer here](https://github.com/Expertek/expertekio-jwt-lambda-authorizer).

## Local testing

You can test the handler locally. You just need to obtain a valid JWT access token to perform the test. The easiest way to do this is to set up
a Lambda function that logs inbound headers (you can just modify the example here to do that), set up a proxy route in `expiora`, and call it
from `expiort` or an extension. Then check the logged header output and use the provided token. Note that proxy router tokens are short lived,
so you'll need to grab it when you're ready to test.

With a valid token, now you just need to create a local `event.json` file that contains it. Start by copying the sample file:

```bash
cp event.json.sample event.json
```

Then replace the `ACCESS_TOKEN` text in that file with the JWT you obtained in the previous step.

Finally, perform the test:

```bash
npm test
```

This uses the [lambda-local](https://www.npmjs.com/package/lambda-local) package to test the authorizer with your token.

## Deployment

When you're ready to deploy to Lambda, you first need to package the bundle:

```bash
npm run bundle
```

This will generate a local `expertekio-jwt-lambda-identity-example-node.zip` bundle (ZIP file) containing all the source and node modules the function needs.

After that, upload to a new Lambda function, and set up an integration with API Gateway. At that point, you're ready to test using `expiora`
or the `ExpertekIODataService` in an extension.

# AWS TextExtract Tables

This is a server application that uses AWS's Textextract to extract tables from images.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What things you need to install the software and how to install them

- Node.js
- npm

### Installing

A step by step series of examples that tell you how to get a development environment running

1. Clone the repository
```
git clone https://github.com/yourusername/aws-textextract-tables.git
```

2. Install NPM packages
```
npm install
```

3. Create a .env file in the root directory of the project and insert your credentials.
```
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_aws_region

# Server Configuration
PORT=your_server_port
```

## Running the tests

To start the server, run the following command:
```
npm start
```

## Prompt
```agsl
Return the user name, dental office, and the 4-digit dental codes with descriptions and insurance fees in this text from a treatment plan:

Full Text:

“{{ text }}”

Treatment Plan Table:

“{{ table }}”

Use this as a template and only include words from the provided text:

{
"patient": "test name",
"dental_office": "test office",
"service_summary": "test summary",
"cdt_codes": [
{
"code": "D1110",
"description": "Cleaning - adult",
"full_fee": 100.00,
"plan_fee": 80
},
{
"code": "D1206",
"description": "Topical fluoride varnish",
"full_fee": 100.00,
"plan_fee": 80
},
{
"code": "D1351",
"description": "Sealant - per tooth",
"full_fee": 100.00,
"plan_fee": 80
}
]
}
```

Prompts can be tested in [MakerSuite](https://makersuite.google.com/app/prompts/new_text) or in [OpenAI's Playground](https://platform.openai.com/playground).

## Built With

* [Node.js](https://nodejs.org/)
* [Express](https://expressjs.com/)
* [AWS SDK](https://aws.amazon.com/sdk-for-node-js/)

## Authors

* **Joseph Muller**


## Acknowledgments

* AWS TextExtract for providing the service to extract tables from images.

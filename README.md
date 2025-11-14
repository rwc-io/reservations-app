# reservations-app
Reservations web app built on Firebase + Angular

## Setup

First you need to configure the appropriate environment variables. You'll need to create these environment variables, exporting from the Firebase project console:

* `FIREBASE_PROJECT_ID`
* `FIREBASE_APP_ID`
* `FIREBASE_STORAGE_BUCKET`
* `FIREBASE_API_KEY`
* `FIREBASE_AUTH_DOMAIN`
* `FIREBASE_MESSAGING_SENDER_ID`

Then run:

```sh
./write-firebase-config.sh
cd hosting
./write-app-config.sh
```



## Running development server

```sh
./emulate.sh
```



asd

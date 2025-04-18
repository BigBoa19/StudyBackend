import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";
import {joinGroup} from "./webapp/joinGroup";
import {leaveGroup} from "./webapp/leaveGroup";
import {updateUser} from "./webapp/updateUser";
import {sendEmail} from "./util/sendEmail";
import {createGroupHandler} from "./webapp/createGroup";
import {updateGroup} from "./webapp/updateGroup";

admin.initializeApp();

const db = admin.firestore();

exports.joinGroup = onRequest((req, res) => joinGroup(db, req, res));
exports.leaveGroup = onRequest((req, res) => leaveGroup(db, req, res));
exports.createGroup = onRequest((req, res) => createGroupHandler(db, req, res));
exports.updateGroup = onRequest((req, res) => updateGroup(db, req, res));
exports.updateUser = onRequest((req, res) => updateUser(db, req, res));

exports.sendEmail = onRequest((req, res) => sendEmail(db, req, res));

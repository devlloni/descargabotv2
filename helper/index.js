const user = require('../model/user');
const data = require('../model/data');

function createUserIfNotExist(screen_name) {
  return new Promise((resolve, reject) => {
    let username = screen_name.toLowerCase();
    user
      .findOne({ screen_name: username })
      .lean()
      .exec()
      .then(users => {
        if (users) resolve(users);
        if (users == null) {
          let u = new user({
            screen_name: username,
            created_date: new Date()
          });
          u.save().then(nuser => resolve(nuser));
        }
      })
      .catch(err => reject(err));
  });
}

function messageTemplate(screen_name) {
  let choice = getRandom(6);
  switch (choice) {
    case 1:
      return '@' + String(screen_name).trim() + '🐝 Hoooooooooola, te dejo el link por aquí http://descargabot.com.ar/downloads/' + String(screen_name) + ' gracias @' + String(screen_name).trim() ;
    break;
    case 2:
    return '@' + String(screen_name).trim() + '🐝 Gracias por llamarme queridx, tome su respetable link  http://descargabot.com.ar/downloads/' + String(screen_name) + ' si no contesto a la brevedad recuerda visitar el link https://descargabot.com.ar/ @'+ String(screen_name).trim();
    break;
    case 3:
    return '@' + String(screen_name).trim() + ' 🐝 Buenas! Aquí está su link :D http://descargabot.com.ar/downloads/' + String(screen_name) + ' 😎😎. Recuerda que si no contesto, puedes ir directamente al link y buscar tu usuario @' + String(screen_name).trim();
    break;
    case 4:
      return '@' + String(screen_name).trim() + '🐝 1, 2, 3, 4... le doy el link por un zapato 🐝 http://descargabot.com.ar/downloads/' + String(screen_name) + ' 👏👏 Cc @' + String(screen_name).trim();
    break;
    case 5:
      return '@' + String(screen_name).trim() + '🐝 Lo pedís lo tenés rey/na ;) 🐝 http://descargabot.com.ar/downloads/' + String(screen_name) + ' Cc @' + String(screen_name).trim();
    break;
    default:
      return '@' + String(screen_name).trim() + '🐝 Holaa, que tengas un bonito día! tome su buen link 🐝 http://descargabot.com.ar/downloads/' + String(screen_name) + ' I might not respond always, So Always check this link when you request for a new video Cc @' + String(screen_name).trim();
  }
}

function getRandom(max) {
  return Math.floor(Math.random() * max) + 1;
}
module.exports = { createUserIfNotExist, messageTemplate };

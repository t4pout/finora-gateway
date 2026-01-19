const bcrypt = require('bcryptjs');
const senha = '123456';

bcrypt.hash(senha, 10, (err, hash) => {
  if (err) {
    console.log('Erro:', err);
  } else {
    console.log('Hash correto:', hash);
  }
});

const bcrypt = require('bcryptjs');
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
const senha = '123456';

bcrypt.compare(senha, hash, (err, result) => {
  if (err) {
    console.log('Erro:', err);
  } else {
    console.log('Senha match:', result);
  }
});

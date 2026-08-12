import type en from './en'

export default {
  common: {
    unexpectedError: 'Bir şeyler ters gitti, lütfen tekrar deneyin',
  },
  auth: {
    loginTitle: 'Giriş yap',
    username: 'Kullanıcı adı veya telefon numarası',
    password: 'Şifre',
    submit: 'Giriş yap',
    invalidCredentials: 'Kullanıcı adı veya şifre hatalı',
    usernameRequired: 'Lütfen kullanıcı adınızı veya telefon numaranızı girin',
    passwordRequired: 'Lütfen şifrenizi girin',
    logout: 'Çıkış yap',
  },
} satisfies typeof en

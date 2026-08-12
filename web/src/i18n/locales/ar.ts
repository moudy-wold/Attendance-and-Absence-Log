import type en from './en'

export default {
  common: {
    unexpectedError: 'حدث خطأ ما، حاول مرة أخرى',
  },
  auth: {
    loginTitle: 'تسجيل الدخول',
    username: 'اسم المستخدم أو رقم الهاتف',
    password: 'كلمة المرور',
    submit: 'دخول',
    invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    usernameRequired: 'الرجاء إدخال اسم المستخدم أو رقم الهاتف',
    passwordRequired: 'الرجاء إدخال كلمة المرور',
    logout: 'تسجيل الخروج',
  },
} satisfies typeof en

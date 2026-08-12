# سيناريو نظام تسجيل الحضور

## المرحلة 1: موظف الدخول (Entry) يولّد الرمز

| # | الخطوة | API |
|---|---|---|
| 1 | يسجّل دخوله | `POST /api/auth/login/` |
| 2 | يختار `check_in` أو `check_out` فتُعرض له شاشة QR | `POST /api/qr/generate/` (View: `GenerateQRTokenView`) |
| 3 | الشاشة تتجدد تلقائيًا كل 15 ثانية | نفس التابع يتكرر |

## المرحلة 2: الموظف يسجّل حضوره/انصرافه

| # | الخطوة | API | ملاحظة |
|---|---|---|---|
| 4 | يسجّل دخوله من الموبايل | `POST /api/auth/login/` | |
| 5 | يمسح الرمز بالكاميرا | — لا API | فك تشفير محلي بحت |
| 6 | التطبيق يتحقق فورًا من صلاحية الرمز | `POST /api/qr/validate/` (View: `ValidateQRView`) | **لو رُفض (400)** → يتوقف هنا، لا يُطلب بصمة |
| 7 | لو صالح، يُطلب من المستخدم البصمة | — لا API | تحقق محلي (Biometric API) |
| 8 | **لو فشلت البصمة** | — لا API | يتوقف نهائيًا، لا يُستدعى أي API |
| 9 | لو نجحت، يُحفظ الحضور/الانصراف فعليًا | `POST /api/attendance/record/` (View: `RecordAttendanceView`) | يفرّق داخليًا بين حالتين: `_check_in()` تنشئ جلسة جديدة، `_check_out()` تُغلق آخر جلسة مفتوحة |
| 10 | الموظف يراجع بصماته الشهرية لاحقًا | `GET /api/attendance/my/` (View: `MyAttendanceView`) | يعرض سجلات الشهر الحالي فقط، وقد تظهر أكثر من جلسة بنفس اليوم |

**قاعدة العمل:** اليوم الواحد يمكن أن يحتوي عدة دورات دخول/خروج (دخول→خروج→دخول→خروج...)، بشرط عدم وجود جلستين مفتوحتين بنفس الوقت — مضمون عبر قيد قاعدة بيانات (`one_open_session_per_user_per_day`) وليس فقط منطق كود.

## المرحلة 3: الأدمن

| # | الخطوة | API |
|---|---|---|
| 11 | يسجّل دخوله | `POST /api/auth/login/` (View: `LoginView`) |
| 12 | ينشئ حساب موظف/موظف دخول جديد | `POST /api/auth/register/` (View: `RegisterView`) |
| 13 | يستعرض قائمة كل الموظفين | `GET /api/admin/employees/` (View: `EmployeeListView`) |
| 14 | يستعرض موظفًا واحدًا مع بصماته (`?year=&month=`) | `GET /api/admin/employees/<id>/` (View: `EmployeeDetailView`) |
| 15 | يصدّر تقرير إكسل شهري | `GET /api/admin/attendance/export/?year=&month=` (View: `ExportAttendanceView`) |

## شروط تسجيل الحضور/الانصراف

| الشرط | رسالة الرفض |
|---|---|
| خروج بلا دخول سابق (أو بعد إغلاق آخر جلسة) | `Cannot check out before checking in.` |
| دخول ثانٍ بلا خروج بينهما | `Already checked in today. Check out first before checking in again.` |
| رمز QR غير موجود | `Invalid QR code.` |
| رمز QR منتهي الصلاحية أو غير فعّال | `This QR code has expired or is inactive.` |

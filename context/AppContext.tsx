export const translations = {
  ar: {
    // صفحة الإعدادات
    settingsTitle: "الإعدادات",
    settingsSubtitle: "تخصيص الهوية وإدارة البيانات السحابية والمحلية",
    profileTitle: "الملف الشخصي",
    profileSubtitle: "الرقم المدني هو مفتاحك السري للمزامنة السحابية",
    civilIdLabel: "الرقم المدني / الوظيفي 🔑",
    civilIdPlaceholder: "أدخل رقمك المميز",
    teacherNameLabel: "اسم المعلم",
    teacherNamePlaceholder: "اسمك الكريم",
    schoolNameLabel: "اسم المدرسة",
    schoolNamePlaceholder: "اسم المدرسة",
    saveProfileBtn: "حفظ البيانات الشخصية",
    
    syncTitle: "المزامنة السحابية اليدوية",
    syncSubtitle: "تحكم كامل في إرسال واستقبال بياناتك",
    pushBtn: "رفع البيانات للسحابة (Push)",
    pushingBtn: "جاري الرفع...",
    pullBtn: "جلب البيانات من السحابة (Pull)",
    pullingBtn: "جاري السحب...",
    syncNote1: "* استخدم (رفع البيانات) في الجهاز الذي يحتوي على أحدث التعديلات.",
    syncNote2: "* استخدم (جلب البيانات) في الجهاز الذي تريد تحديثه.",
    
    backupTitle: "النسخ الاحتياطي المحلي",
    backupSubtitle: "حفظ واستعادة البيانات يدوياً (JSON)",
    createBackupBtn: "إنشاء نسخة احتياطية",
    importBackupBtn: "استيراد من ملف",
    
    dangerZoneBtn: "إعادة ضبط المصنع (حذف كل شيء)",
    
    // التنبيهات
    alertEnterCivilId: "يرجى إدخال (الرقم المدني/الوظيفي) أولاً وحفظه.",
    alertConfirmPush: "هل أنت متأكد أنك تريد رفع بيانات هذا الجهاز ليتم استبدالها في السحابة؟",
    alertPushSuccess: "✅ تم رفع بياناتك إلى السحابة بنجاح!",
    alertSyncError: "❌ خطأ في الاتصال بالسحابة. تأكد من الإنترنت.",
    alertConfirmPull: "تحذير: جلب البيانات سيقوم باستبدال كافة البيانات في هذا الجهاز ببيانات السحابة. هل أنت متأكد؟",
    alertPullSuccess: "✅ تم جلب البيانات وترتيبها بنجاح! سيتم إعادة تشغيل التطبيق.",
    alertNoDataForId: "ℹ️ لا توجد بيانات محفوظة في السحابة بهذا الرقم.",
    alertNoDataInCloud: "ℹ️ لا توجد بيانات في السحابة مرتبطة بهذا الرقم المدني.",
    alertExportSuccess: "✅ تم تصدير النسخة الاحتياطية بنجاح",
    alertExportError: "❌ خطأ في التصدير",
    alertConfirmRestore: "سيتم استبدال البيانات الحالية بالملف المختار. هل أنت متأكد؟",
    alertRestoreSuccess: "✅ تم الاستعادة بنجاح! سيتم إعادة تشغيل التطبيق.",
    alertInvalidFile: "❌ الملف غير صالح",
    alertConfirmReset: "⚠️ تحذير نهائي: سيتم حذف كل شيء نهائياً. هل تريد الاستمرار؟",
    alertResetSuccess: "تم مسح البيانات بنجاح 🚀"
  },
  en: {
    // Settings Page
    settingsTitle: "Settings",
    settingsSubtitle: "Customize Identity and Manage Cloud/Local Data",
    profileTitle: "Profile",
    profileSubtitle: "Your Civil ID is your secret key for cloud sync",
    civilIdLabel: "Civil / Job ID 🔑",
    civilIdPlaceholder: "Enter your unique ID",
    teacherNameLabel: "Teacher Name",
    teacherNamePlaceholder: "Your Name",
    schoolNameLabel: "School Name",
    schoolNamePlaceholder: "School Name",
    saveProfileBtn: "Save Profile Data",
    
    syncTitle: "Manual Cloud Sync",
    syncSubtitle: "Full control over sending and receiving your data",
    pushBtn: "Push Data to Cloud",
    pushingBtn: "Pushing...",
    pullBtn: "Pull Data from Cloud",
    pullingBtn: "Pulling...",
    syncNote1: "* Use (Push Data) on the device with the latest updates.",
    syncNote2: "* Use (Pull Data) on the device you want to update.",
    
    backupTitle: "Local Backup",
    backupSubtitle: "Manually save and restore data (JSON)",
    createBackupBtn: "Create Backup",
    importBackupBtn: "Import from File",
    
    dangerZoneBtn: "Factory Reset (Delete Everything)",
    
    // Alerts
    alertEnterCivilId: "Please enter your Civil/Job ID first and save it.",
    alertConfirmPush: "Are you sure you want to push this device's data to overwrite the cloud?",
    alertPushSuccess: "✅ Data successfully pushed to the cloud!",
    alertSyncError: "❌ Cloud connection error. Check your internet.",
    alertConfirmPull: "Warning: Pulling data will overwrite all data on this device with cloud data. Are you sure?",
    alertPullSuccess: "✅ Data successfully pulled and organized! App will restart.",
    alertNoDataForId: "ℹ️ No data found in the cloud for this ID.",
    alertNoDataInCloud: "ℹ️ No data in the cloud linked to this Civil ID.",
    alertExportSuccess: "✅ Backup successfully exported",
    alertExportError: "❌ Export Error",
    alertConfirmRestore: "Current data will be replaced by the selected file. Are you sure?",
    alertRestoreSuccess: "✅ Restored successfully! App will restart.",
    alertInvalidFile: "❌ Invalid File",
    alertConfirmReset: "⚠️ FINAL WARNING: Everything will be permanently deleted. Continue?",
    alertResetSuccess: "Data wiped successfully 🚀"
  }
};

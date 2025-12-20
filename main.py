import flet as ft
import openpyxl
import csv
import datetime

# --- إعدادات ثابتة ---
POSITIVE_BEHAVIORS = ["مشاركة فعالة", "حل الواجب", "احترام المعلم", "نظافة", "تعاون", "إجابة ذكية"]
NEGATIVE_BEHAVIORS = ["إزعاج", "نسيان الكتاب", "تأخر", "نوم في الحصة", "استخدام الهاتف", "شغب"]

class SchoolApp:
    def __init__(self):
        self.school_data = {}
        self.current_class = ""
        self.selected_date = datetime.date.today().strftime("%Y-%m-%d")
        
    def main(self, page: ft.Page):
        # ==============================================
        # 1. الإعدادات الأساسية لـiOS (حل المشاكل الجذرية)
        # ==============================================
        page.title = "ضبط السلوكيات"
        page.rtl = True
        page.theme_mode = ft.ThemeMode.LIGHT
        
        # لا تستخدم أي خطوط خارجية - استخدم النظام
        page.fonts = {}
        page.theme = ft.Theme()
        
        # إعدادات خاصة لـiOS
        page.platform = ft.PagePlatform.IOS
        page.scroll = ft.ScrollMode.AUTO
        page.bgcolor = "#F8F9FA"
        
        # ==============================================
        # 2. حقول الإدخال المخصصة لـiOS
        # ==============================================
        txt_class_name = ft.CupertinoTextField(
            placeholder="اسم الفصل",
            bgcolor=ft.colors.WHITE,
            border_radius=10,
            expand=True,
            padding=ft.padding.all(12),
            text_align=ft.TextAlign.RIGHT
        )
        
        txt_student_name = ft.CupertinoTextField(
            placeholder="اسم الطالب",
            bgcolor=ft.colors.WHITE,
            border_radius=10,
            expand=True,
            padding=ft.padding.all(12),
            text_align=ft.TextAlign.RIGHT
        )
        
        # ==============================================
        # 3. إدارة البيانات
        # ==============================================
        def load_data():
            try:
                data = page.client_storage.get("school_db")
                self.school_data = data if isinstance(data, dict) else {}
            except:
                self.school_data = {}

        def save_data():
            page.client_storage.set("school_db", self.school_data)

        load_data()
        
        # ==============================================
        # 4. شريط التنقل العلوي (بديل للنظام القديم)
        # ==============================================
        def create_app_bar(title, show_back=False):
            actions = []
            if show_back:
                actions.append(
                    ft.IconButton(
                        ft.icons.ARROW_BACK_IOS,
                        icon_color="white",
                        on_click=lambda e: page.go("/"),
                        tooltip="رجوع"
                    )
                )
            
            return ft.Container(
                height=60,
                bgcolor="#2E7D32",  # أخضر
                padding=ft.padding.only(left=10, right=10),
                content=ft.Row(
                    [
                        *actions,
                        ft.Text(
                            title,
                            color="white",
                            size=20,
                            weight="bold",
                            expand=True,
                            text_align=ft.TextAlign.CENTER
                        ),
                    ],
                    alignment=ft.MainAxisAlignment.START,
                    vertical_alignment=ft.CrossAxisAlignment.CENTER
                )
            )
        
        # ==============================================
        # 5. الواجهة الرئيسية
        # ==============================================
        def show_home():
            page.clean()
            
            # زر إضافة فصل
            def add_class_action(e):
                if txt_class_name.value and txt_class_name.value not in self.school_data:
                    self.school_data[txt_class_name.value] = []
                    save_data()
                    txt_class_name.value = ""
                    show_home()
            
            # قائمة الفصول
            classes_grid = ft.GridView(
                expand=True,
                max_extent=200,
                child_aspect_ratio=1.5,
                spacing=10,
                run_spacing=10,
            )
            
            for class_name in self.school_data:
                student_count = len(self.school_data[class_name])
                classes_grid.controls.append(
                    ft.Container(
                        bgcolor="#4CAF50",
                        border_radius=15,
                        padding=15,
                        on_click=lambda e, name=class_name: open_class(name),
                        content=ft.Column([
                            ft.Icon(ft.icons.CLASS_, size=40, color="white"),
                            ft.Text(
                                class_name,
                                color="white",
                                size=16,
                                weight="bold",
                                text_align=ft.TextAlign.CENTER
                            ),
                            ft.Text(
                                f"{student_count} طالب",
                                color="white",
                                size=12,
                                text_align=ft.TextAlign.CENTER
                            )
                        ], spacing=5, horizontal_alignment=ft.CrossAxisAlignment.CENTER)
                    )
                )
            
            page.add(
                ft.Column([
                    create_app_bar("الفصول الدراسية"),
                    
                    # قسم إضافة فصل
                    ft.Container(
                        bgcolor="white",
                        margin=ft.margin.all(10),
                        border_radius=15,
                        padding=15,
                        content=ft.Column([
                            ft.Text("إضافة فصل جديد", size=18, weight="bold", color="#2E7D32"),
                            txt_class_name,
                            ft.Container(height=10),
                            ft.FilledButton(
                                "إضافة فصل",
                                icon=ft.icons.ADD,
                                on_click=add_class_action,
                                style=ft.ButtonStyle(bgcolor={"": "#4CAF50"}, color={"": "white"})
                            )
                        ])
                    ),
                    
                    # قائمة الفصول
                    ft.Container(
                        bgcolor="white",
                        margin=ft.margin.symmetric(horizontal=10),
                        border_radius=15,
                        padding=15,
                        expand=True,
                        content=ft.Column([
                            ft.Text("الفصول المتاحة", size=18, weight="bold", color="#2E7D32"),
                            ft.Container(height=10),
                            classes_grid
                        ])
                    )
                ], spacing=0, expand=True)
            )
        
        # ==============================================
        # 6. واجهة الفصل
        # ==============================================
        def open_class(class_name):
            self.current_class = class_name
            page.clean()
            
            students = self.school_data.get(class_name, [])
            
            # زر إضافة طالب
            def add_student_action(e):
                if txt_student_name.value:
                    students.append({
                        "name": txt_student_name.value,
                        "score": 0,
                        "history": [],
                        "attendance": {}
                    })
                    save_data()
                    txt_student_name.value = ""
                    open_class(class_name)
            
            # قائمة الطلاب
            students_list = ft.ListView(expand=True, spacing=5)
            
            for student in students:
                # حالة الحضور
                att_status = student.get('attendance', {}).get(self.selected_date, "present")
                status_color = "#4CAF50" if att_status == "present" else "#F44336"
                status_icon = ft.icons.CHECK_CIRCLE if att_status == "present" else ft.icons.CANCEL
                
                students_list.controls.append(
                    ft.Container(
                        bgcolor="white",
                        border_radius=10,
                        padding=15,
                        margin=ft.margin.symmetric(horizontal=10, vertical=5),
                        on_click=lambda e, s=student: show_student_details(s),
                        content=ft.Row([
                            # حالة الحضور
                            ft.Icon(status_icon, color=status_color),
                            
                            # معلومات الطالب
                            ft.Column([
                                ft.Text(student['name'], weight="bold", size=16),
                                ft.Text(f"النقاط: {student['score']}", color="#2196F3", size=14),
                            ], expand=True, spacing=2),
                            
                            # زر السلوكيات
                            ft.IconButton(
                                ft.icons.ADD_REACTION,
                                icon_color="#FF9800",
                                on_click=lambda e, s=student: show_behavior_menu(s)
                            ),
                        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN)
                    )
                )
            
            # زر التاريخ
            date_display = ft.Text(f"تاريخ: {self.selected_date}", size=16, color="#666")
            
            page.add(
                ft.Column([
                    create_app_bar(class_name, show_back=True),
                    
                    # قسم إضافة طالب
                    ft.Container(
                        bgcolor="white",
                        margin=ft.margin.all(10),
                        border_radius=15,
                        padding=15,
                        content=ft.Column([
                            ft.Text("إضافة طالب جديد", size=18, weight="bold", color="#2E7D32"),
                            txt_student_name,
                            ft.Container(height=10),
                            ft.Row([
                                ft.TextButton(
                                    "تغيير التاريخ",
                                    icon=ft.icons.CALENDAR_TODAY,
                                    on_click=lambda e: change_date_dialog()
                                ),
                                ft.Container(width=20),
                                ft.FilledButton(
                                    "إضافة طالب",
                                    icon=ft.icons.PERSON_ADD,
                                    on_click=add_student_action,
                                    style=ft.ButtonStyle(bgcolor={"": "#4CAF50"}, color={"": "white"})
                                )
                            ])
                        ])
                    ),
                    
                    # التاريخ الحالي
                    ft.Container(
                        padding=ft.padding.symmetric(horizontal=20),
                        content=date_display
                    ),
                    
                    # قائمة الطلاب
                    ft.Container(
                        margin=ft.margin.only(top=10),
                        expand=True,
                        content=students_list
                    )
                ], spacing=0, expand=True)
            )
        
        # ==============================================
        # 7. تفاصيل الطالب
        # ==============================================
        def show_student_details(student):
            page.clean()
            
            history = student.get('history', [])
            attendance = student.get('attendance', {})
            absent_days = [date for date, status in attendance.items() if status == "absent"]
            
            # علامات التبويب
            behavior_content = ft.ListView(spacing=5, padding=10)
            if history:
                for record in reversed(history):
                    behavior_content.controls.append(
                        ft.Container(
                            bgcolor="#E8F5E9" if record['type'] == 'pos' else "#FFEBEE",
                            border_radius=10,
                            padding=10,
                            content=ft.Column([
                                ft.Text(record['note'], weight="bold"),
                                ft.Text(f"التاريخ: {record['date']}", size=12, color="#666"),
                            ])
                        )
                    )
            else:
                behavior_content.controls.append(
                    ft.Text("لا يوجد سجل سلوكيات", text_align=ft.TextAlign.CENTER, color="#999")
                )
            
            attendance_content = ft.ListView(spacing=5, padding=10)
            if absent_days:
                for day in sorted(absent_days, reverse=True):
                    attendance_content.controls.append(
                        ft.Container(
                            bgcolor="#FFEBEE",
                            border_radius=10,
                            padding=10,
                            content=ft.Row([
                                ft.Icon(ft.icons.EVENT_BUSY, color="#F44336"),
                                ft.Text(f"غائب: {day}", expand=True),
                            ])
                        )
                    )
            else:
                attendance_content.controls.append(
                    ft.Text("لا يوجد غياب", text_align=ft.TextAlign.CENTER, color="#4CAF50")
                )
            
            # التبويبات
            tabs = ft.Tabs(
                selected_index=0,
                tabs=[
                    ft.Tab(
                        text="السلوكيات",
                        icon=ft.icons.ASSIGNMENT,
                        content=behavior_content
                    ),
                    ft.Tab(
                        text="الغياب",
                        icon=ft.icons.CALENDAR_VIEW_MONTH,
                        content=attendance_content
                    ),
                ],
                expand=True
            )
            
            page.add(
                ft.Column([
                    create_app_bar(student['name'], show_back=True),
                    
                    # الإحصائيات
                    ft.Container(
                        bgcolor="white",
                        margin=10,
                        border_radius=15,
                        padding=20,
                        content=ft.Row([
                            ft.Column([
                                ft.Text("النقاط", color="#666"),
                                ft.Text(str(student['score']), size=32, weight="bold", color="#2196F3")
                            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, expand=True),
                            
                            ft.VerticalDivider(),
                            
                            ft.Column([
                                ft.Text("الغياب", color="#666"),
                                ft.Text(str(len(absent_days)), size=32, weight="bold", color="#F44336")
                            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, expand=True),
                        ])
                    ),
                    
                    # التبويبات
                    ft.Container(
                        margin=ft.margin.symmetric(horizontal=10),
                        border_radius=15,
                        expand=True,
                        content=tabs
                    )
                ], spacing=0, expand=True)
            )
        
        # ==============================================
        # 8. وظائف مساعدة
        # ==============================================
        def show_behavior_menu(student):
            # نافذة اختيار السلوك
            def add_behavior(behavior_type, note):
                if 'history' not in student:
                    student['history'] = []
                
                student['history'].append({
                    "date": self.selected_date,
                    "type": behavior_type,
                    "note": note
                })
                
                if behavior_type == 'pos':
                    student['score'] += 1
                else:
                    student['score'] -= 1
                
                save_data()
                page.snack_bar = ft.SnackBar(ft.Text(f"تم إضافة: {note}"), bgcolor="#4CAF50")
                page.snack_bar.open = True
                page.update()
            
            # إنشاء القائمة
            behavior_items = []
            
            # سلوكيات إيجابية
            for behavior in POSITIVE_BEHAVIORS:
                behavior_items.append(
                    ft.ListTile(
                        leading=ft.Icon(ft.icons.ADD_CIRCLE, color="#4CAF50"),
                        title=ft.Text(behavior),
                        on_click=lambda e, b=behavior: add_behavior('pos', b)
                    )
                )
            
            # سلوكيات سلبية
            for behavior in NEGATIVE_BEHAVIORS:
                behavior_items.append(
                    ft.ListTile(
                        leading=ft.Icon(ft.icons.REMOVE_CIRCLE, color="#F44336"),
                        title=ft.Text(behavior),
                        on_click=lambda e, b=behavior: add_behavior('neg', b)
                    )
                )
            
            # عرض القائمة
            page.dialog = ft.AlertDialog(
                title=ft.Text("اختر سلوك"),
                content=ft.Container(
                    width=300,
                    height=400,
                    content=ft.ListView(behavior_items)
                )
            )
            page.dialog.open = True
            page.update()
        
        def change_date_dialog():
            def update_date(e):
                if date_picker.value:
                    self.selected_date = date_picker.value.strftime("%Y-%m-%d")
                    if self.current_class:
                        open_class(self.current_class)
                    page.update()
            
            date_picker = ft.DatePicker(
                first_date=datetime.datetime(2023, 1, 1),
                last_date=datetime.datetime(2030, 12, 31),
                on_change=update_date
            )
            
            page.overlay.append(date_picker)
            date_picker.pick_date()
        
        # ==============================================
        # 9. بدء التطبيق
        # ==============================================
        show_home()

# تشغيل التطبيق
if __name__ == "__main__":
    ft.app(target=SchoolApp().main)

"""Test script for tree-sitter-vba parser.
Run with: python test/test_parser.py

Requires: tree-sitter Python package and tree_sitter_vba.dll
"""
import ctypes, tree_sitter as ts, sys, os

# Load DLL (look in project root)
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dll_path = os.path.join(repo_root, 'tree_sitter_vba.dll')

if not os.path.exists(dll_path):
    print(f'ERROR: DLL not found at {dll_path}')
    print('Run: zig cc -shared -O3 -Isrc -Isrc/tree_sitter src/parser.c -o tree_sitter_vba.dll -target x86_64-windows-msvc')
    sys.exit(1)

lib = ctypes.CDLL(dll_path)
lib.tree_sitter_vba.restype = ctypes.c_void_p
lang = ts.Language(lib.tree_sitter_vba())
parser = ts.Parser(lang)

# Test cases: (name, code, expected_root_type, expected_children)
tests = [
    ('Sub procedure', '''
Sub Hello()
    Dim msg As String
    msg = "Hello World"
End Sub
''', 'source_file', 1),

    ('Function with return type', '''
Function Add(x As Integer) As Integer
    Add = x + 1
End Function
''', 'source_file', 1),

    ('If-ElseIf-Else', '''
Sub Test(x As Integer)
    If x > 10 Then
        MsgBox "big"
    ElseIf x > 5 Then
        MsgBox "medium"
    Else
        MsgBox "small"
    End If
End Sub
''', 'source_file', 1),

    ('For loop', '''
Sub Test()
    Dim i As Integer
    For i = 1 To 10
        Debug.Print i
    Next
End Sub
''', 'source_file', 1),

    ('For Each loop', '''
Sub Test()
    Dim c As Variant
    For Each c In Collection
        Debug.Print c
    Next
End Sub
''', 'source_file', 1),

    ('Do While loop', '''
Sub Test()
    Dim x As Integer
    x = 1
    Do While x < 10
        x = x + 1
    Loop
End Sub
''', 'source_file', 1),

    ('Do Loop Until', '''
Sub Test()
    Dim x As Integer
    x = 1
    Do
        x = x + 1
    Loop Until x = 10
End Sub
''', 'source_file', 1),

    ('Select Case', '''
Sub Test(x As Integer)
    Select Case x
        Case 1
            MsgBox "One"
        Case Else
            MsgBox "Other"
    End Select
End Sub
''', 'source_file', 1),

    ('With statement', '''
Sub Test()
    With ActiveWorkbook
        .Name = "Test"
    End With
End Sub
''', 'source_file', 1),

    ('On Error Resume Next', '''
Sub Test()
    On Error Resume Next
    Dim x As Integer
    x = 1 / 0
End Sub
''', 'source_file', 1),

    ('On Error GoTo', '''
Sub Test()
    On Error GoTo ErrHandler
    Exit Sub
ErrHandler:
    Resume Next
End Sub
''', 'source_file', 1),

    ('Property Get/Let/Set', '''
Property Get Name() As String
    Name = m_Name
End Property
Property Let Name(v As String)
    m_Name = v
End Property
Property Set Obj(v As Object)
    Set m_Obj = v
End Property
''', 'source_file', 3),

    ('Type declaration', '''
Private Type Person
    Name As String
    Age As Integer
End Type
''', 'source_file', 1),

    ('Enum declaration', '''
Public Enum Color
    Red
    Green
    Blue = 5
End Enum
''', 'source_file', 1),

    ('Const declaration', '''
Public Const PI As Double = 3.14159
Private Const NAME As String = "Test"
''', 'source_file', 2),

    ('Option statements', '''
Option Explicit
Option Compare Text
Option Private Module
''', 'source_file', 3),

    ('Set statement', '''
Sub Test()
    Dim ws As Object
    Set ws = ActiveWorkbook.Sheets("Sheet1")
End Sub
''', 'source_file', 1),

    ('Erase statement', '''
Sub Test()
    Dim arr(10) As Integer
    Erase arr
End Sub
''', 'source_file', 1),

    ('ReDim statement', '''
Sub Test()
    Dim arr() As Integer
    ReDim arr(10)
    ReDim Preserve arr(20)
End Sub
''', 'source_file', 1),

    ('Boolean and Nothing', '''
Sub Test()
    Dim flag As Boolean
    Dim obj As Object
    flag = True
    flag = False
    Set obj = Nothing
    Set obj = Null
End Sub
''', 'source_file', 1),

    ('Case insensitive keywords', '''
sub lowercase()
    dim x as integer
    x = 10
end sub
Function MIXEDCASE()
    MIXEDCASE = 1
End Function
''', 'source_file', 2),

    ('Member access', '''
Sub Test()
    Dim wb As Object
    Set wb = Application.ActiveWorkbook
    MsgBox wb.Name
End Sub
''', 'source_file', 1),
]

passed = 0
failed = 0

print(f'Testing tree-sitter-vba ({len(tests)} tests)')
print('=' * 50)

for name, code, expected_type, expected_count in tests:
    tree = parser.parse(bytes(code, 'utf-8'))
    root = tree.root_node
    
    ok = True
    errors = []
    
    if root.type != expected_type:
        ok = False
        errors.append(f'root type: expected {expected_type}, got {root.type}')
    
    if root.child_count != expected_count:
        ok = False
        errors.append(f'child count: expected {expected_count}, got {root.child_count}')
    
    if root.has_error:
        ok = False
        errors.append('parse tree has ERROR nodes')
    
    status = 'PASS' if ok else 'FAIL'
    if ok:
        passed += 1
        print(f'  [PASS] {name}')
    else:
        failed += 1
        print(f'  [FAIL] {name}')
        for e in errors:
            print(f'         {e}')

print('=' * 50)
print(f'Results: {passed}/{len(tests)} passed, {failed} failed')
sys.exit(0 if failed == 0 else 1)

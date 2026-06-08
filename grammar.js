// Derived from Rubberduck VBA ANTLR4 grammar (GPL-3.0)
// Source: https://github.com/rubberduck-vba/Rubberduck

// Case-insensitive keyword helper for VBA
function ci(word) {
  return new RegExp(word, 'i');
}

module.exports = grammar({
  name: 'vba',

  extras: $ => [
    /\s/,
    $.comment,
    $._line_continuation,
  ],

  conflicts: $ => [
    [$.primary_expression, $.function_call],
  ],

  rules: {
    source_file: $ => repeat($._module_scope),

    comment: $ => token(seq("'", /[^\n]*/)),

    // VBA line continuation: underscore at end of line
    _line_continuation: $ => /_[ \t]*\r?\n/,

    // --- Top Level ---
    _module_scope: $ => choice(
      $.option_statement,
      $.sub_statement,
      $.function_statement,
    ),

    option_statement: $ => seq(
      ci('Option'),
      choice(ci('Explicit'), ci('Compare'), ci('Base'), ci('Private')),
    ),

    sub_statement: $ => seq(
      optional(choice(ci('Public'), ci('Private'), ci('Static'))),
      ci('Sub'),
      $.identifier,
      '(',
      optional($._parameter_list),
      ')',
      repeat($._statement),
      ci('End'),
      ci('Sub'),
    ),

    function_statement: $ => seq(
      optional(choice(ci('Public'), ci('Private'), ci('Static'))),
      ci('Function'),
      $.identifier,
      '(',
      optional($._parameter_list),
      ')',
      optional(seq(ci('As'), $.type)),
      repeat($._statement),
      ci('End'),
      ci('Function'),
    ),

    _parameter_list: $ => seq(
      $._parameter,
      repeat(seq(',', $._parameter)),
    ),

    _parameter: $ => seq(
      optional(choice(ci('Optional'), ci('ByVal'), ci('ByRef'), ci('ParamArray'))),
      $.identifier,
      optional(seq(ci('As'), $.type)),
      optional(seq('=', $.expression)),
    ),

    type: $ => $.identifier,

    // --- Statements ---
    _statement: $ => choice(
      $.if_statement,
      $.for_statement,
      $.for_each_statement,
      $.while_statement,
      $.do_statement,
      $.with_statement,
      $.select_case_statement,
      $.assignment_statement,
      $.call_statement,
      $.exit_statement,
      $.goto_statement,
      $.dim_statement,
      $.const_statement,
      $.set_statement,
    ),

    if_statement: $ => seq(
      ci('If'), $.expression, ci('Then'),
      repeat($._statement),
      optional(seq(ci('Else'), repeat($._statement))),
      ci('End'), ci('If'),
    ),

    for_statement: $ => seq(
      ci('For'), $.identifier, '=', $.expression, ci('To'), $.expression,
      optional(seq(ci('Step'), $.expression)),
      repeat($._statement),
      ci('Next'),
    ),

    for_each_statement: $ => seq(
      ci('For'), ci('Each'), $.identifier, ci('In'), $.expression,
      repeat($._statement),
      ci('Next'),
    ),

    while_statement: $ => seq(
      ci('While'), $.expression,
      repeat($._statement),
      ci('Wend'),
    ),

    do_statement: $ => choice(
      seq(ci('Do'), choice(ci('While'), ci('Until')), $.expression, repeat($._statement), ci('Loop')),
      seq(ci('Do'), repeat($._statement), ci('Loop'), choice(ci('While'), ci('Until')), $.expression),
    ),

    with_statement: $ => seq(
      ci('With'), $.expression,
      repeat($._statement),
      ci('End'), ci('With'),
    ),

    select_case_statement: $ => seq(
      ci('Select'), ci('Case'), $.expression,
      repeat($.case_clause),
      optional(seq(ci('Case'), ci('Else'), repeat($._statement))),
      ci('End'), ci('Select'),
    ),

    case_clause: $ => seq(
      ci('Case'), choice($.expression, seq(ci('Is'), $.expression)),
      repeat($._statement),
    ),

    assignment_statement: $ => seq(
      $.expression, '=', $.expression,
    ),

    set_statement: $ => seq(
      ci('Set'), $.expression, '=', $.expression,
    ),

    call_statement: $ => seq(
      optional(ci('Call')), $.expression,
    ),

    exit_statement: $ => seq(
      ci('Exit'), choice(ci('Sub'), ci('Function'), ci('Do'), ci('For'), ci('While')),
    ),

    goto_statement: $ => seq(
      ci('GoTo'), $.expression,
    ),

    dim_statement: $ => seq(
      choice(ci('Dim'), ci('Public'), ci('Private'), ci('Static')),
      $.identifier,
      optional(seq(ci('As'), $.type)),
      optional(seq('=', $.expression)),
      repeat(seq(',', $.identifier, optional(seq(ci('As'), $.type)))),
    ),

    const_statement: $ => seq(
      optional(choice(ci('Public'), ci('Private'))),
      ci('Const'), $.identifier, optional(seq(ci('As'), $.type)), '=', $.expression,
    ),

    // --- Expressions ---
    expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.primary_expression,
      $.function_call,
    ),

    binary_expression: $ => choice(
      prec.left(1, seq($.expression, choice('+', '-', '*', '/', '\\', 'Mod', '^'), $.expression)),
      prec.left(2, seq($.expression, '&', $.expression)),
      prec.left(3, seq($.expression, choice('=', '<>', '<', '>', '<=', '>='), $.expression)),
      prec.left(4, seq($.expression, choice(ci('And'), ci('Or'), ci('Xor')), $.expression)),
      prec.left(5, seq(ci('Not'), $.expression)),
    ),

    unary_expression: $ => seq(
      choice(ci('Not'), '-'), $.expression,
    ),

    primary_expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
      $.boolean,
      seq('(', $.expression, ')'),
    ),

    function_call: $ => seq(
      $.identifier, '(', optional(seq($.expression, repeat(seq(',', $.expression)))), ')',
    ),

    number: $ => token(/\d+(\.\d*)?([eE][+-]?\d+)?/),
    string: $ => token(seq('"', repeat(choice(/[^"]/, '""')), '"')),
    boolean: $ => choice(ci('True'), ci('False')),
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

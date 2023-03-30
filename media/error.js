const errors = {
  // 执行环境不安全
  NOT_SECURE: {
    code: 'NOT_SECURE',
    message: 'Not Secure'
  },
  // 浏览器版本不支持
  NOT_SUPPORT: {
    code: 'NOT_SUPPORT',
    message: 'Not Support'
  },
  // 用户未授权
  NOT_PERMISSION: {
    code: 'NOT_PERMISSION',
    message: 'Not Permission'
  }
}

export default function rejectError (code) {
  const { code: cause, message } = errors[code]
  return new Error(message, {
    cause
  })
}

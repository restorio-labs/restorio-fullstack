# i18n Integration Examples

This document provides practical examples of integrating internationalization (i18n) libraries with the `@restorio/ui` package.

---

## Table of Contents

1. [react-i18next Integration](#react-i18next-integration)
2. [FormatJS (react-intl) Integration](#formatjs-react-intl-integration)
3. [next-intl Integration](#next-intl-integration)
4. [Custom i18n Solution](#custom-i18n-solution)
5. [RTL Support Examples](#rtl-support-examples)
6. [Common Patterns](#common-patterns)

---

## react-i18next Integration

### Setup

```bash
npm install react-i18next i18next
```

### Configuration

```typescript
// i18n.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import ar from './locales/ar.json';

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    ar: { translation: ar },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
```

### Translation Files

```json
// locales/en.json
{
  "auth": {
    "login": "Sign in",
    "email": "Email address",
    "password": "Password",
    "emailPlaceholder": "Enter your email",
    "emailError": "Please enter a valid email",
    "emailHelper": "We'll never share your email"
  },
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "close": "Close"
  },
  "aria": {
    "closeModal": "Close dialog",
    "closeToast": "Dismiss notification",
    "loading": "Loading content",
    "required": "required field"
  },
  "theme": {
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "switcherLabel": "Current theme: {{theme}}. Click to cycle theme."
  }
}
```

```json
// locales/ar.json (RTL example)
{
  "auth": {
    "login": "تسجيل الدخول",
    "email": "عنوان البريد الإلكتروني",
    "password": "كلمة المرور",
    "emailPlaceholder": "أدخل بريدك الإلكتروني",
    "emailError": "يرجى إدخال بريد إلكتروني صالح",
    "emailHelper": "لن نشارك بريدك الإلكتروني أبدًا"
  },
  "buttons": {
    "submit": "إرسال",
    "cancel": "إلغاء",
    "save": "حفظ",
    "delete": "حذف",
    "close": "إغلاق"
  }
}
```

### App Setup

```tsx
// App.tsx
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '@restorio/ui';
import i18n from './i18n';

export const App = () => {
  const direction = i18n.dir(); // 'ltr' or 'rtl'

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider direction={direction}>
        <YourApp />
      </ThemeProvider>
    </I18nextProvider>
  );
};
```

### Component Examples

```tsx
// LoginForm.tsx
import { useTranslation } from 'react-i18next';
import { Form, FormField, FormLabel, FormControl, FormDescription, FormMessage, FormActions, Input, Button } from '@restorio/ui';

export const LoginForm = () => {
  const { t } = useTranslation();

  return (
    <Form>
      <FormField>
        <FormLabel required requiredAriaLabel={t('aria.required')}>
          {t('auth.email')}
        </FormLabel>
        <FormControl>
          <Input
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            error={t('auth.emailError')}
          />
        </FormControl>
        <FormDescription>
          {t('auth.emailHelper')}
        </FormDescription>
        <FormMessage>{/* Error messages here */}</FormMessage>
      </FormField>

      <FormActions align="end">
        <Button variant="secondary">
          {t('buttons.cancel')}
        </Button>
        <Button type="submit">
          {t('auth.login')}
        </Button>
      </FormActions>
    </Form>
  );
};
```

```tsx
// ThemeSwitcherExample.tsx
import { useTranslation } from 'react-i18next';
import { ThemeSwitcher } from '@restorio/ui';

export const ThemedSwitcher = () => {
  const { t } = useTranslation();

  return (
    <ThemeSwitcher
      showLabel
      lightLabel={t('theme.light')}
      darkLabel={t('theme.dark')}
      systemLabel={t('theme.system')}
      ariaLabelTemplate={(theme) => t('theme.switcherLabel', { theme })}
    />
  );
};
```

```tsx
// ModalExample.tsx
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '@restorio/ui';

export const ConfirmDialog = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('dialogs.confirm.title')}
      closeButtonAriaLabel={t('aria.closeModal')}
    >
      <p>{t('dialogs.confirm.message')}</p>
      <div className="mt-4 flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose}>
          {t('buttons.cancel')}
        </Button>
        <Button variant="danger">
          {t('buttons.delete')}
        </Button>
      </div>
    </Modal>
  );
};
```

### Pluralization Example

```json
// locales/en.json
{
  "orderCount_one": "{{count}} order",
  "orderCount_other": "{{count}} orders",
  "itemsInCart_zero": "Your cart is empty",
  "itemsInCart_one": "{{count}} item in cart",
  "itemsInCart_other": "{{count}} items in cart"
}
```

```tsx
import { useTranslation } from 'react-i18next';
import { Text } from '@restorio/ui';

export const OrderCounter = ({ count }: { count: number }) => {
  const { t } = useTranslation();

  return (
    <Text variant="body-md">
      {t('orderCount', { count })}
    </Text>
  );
};
```

### Date/Number Formatting

```tsx
import { useTranslation } from 'react-i18next';
import { Text } from '@restorio/ui';

export const OrderSummary = ({ total, date }: { total: number; date: Date }) => {
  const { i18n } = useTranslation();

  const formattedTotal = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
  }).format(total);

  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);

  return (
    <div>
      <Text>Total: {formattedTotal}</Text>
      <Text>Date: {formattedDate}</Text>
    </div>
  );
};
```

---

## FormatJS (react-intl) Integration

### Setup

```bash
npm install react-intl
```

### Configuration

```tsx
// App.tsx
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@restorio/ui';
import { useState } from 'react';

import enMessages from './locales/en.json';
import esMessages from './locales/es.json';

const messages = {
  en: enMessages,
  es: esMessages,
};

export const App = () => {
  const [locale, setLocale] = useState('en');
  const direction = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr';

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <ThemeProvider direction={direction}>
        <YourApp />
      </ThemeProvider>
    </IntlProvider>
  );
};
```

### Component Examples

```tsx
// LoginForm.tsx
import { FormattedMessage, useIntl } from 'react-intl';
import { Form, FormField, FormLabel, FormControl, Input, Button, FormActions } from '@restorio/ui';

export const LoginForm = () => {
  const intl = useIntl();

  return (
    <Form>
      <FormField>
        <FormLabel required requiredAriaLabel={intl.formatMessage({ id: 'aria.required' })}>
          <FormattedMessage id="auth.email" />
        </FormLabel>
        <FormControl>
          <Input
            type="email"
            placeholder={intl.formatMessage({ id: 'auth.emailPlaceholder' })}
          />
        </FormControl>
      </FormField>

      <FormActions align="end">
        <Button variant="secondary">
          <FormattedMessage id="buttons.cancel" />
        </Button>
        <Button type="submit">
          <FormattedMessage id="auth.login" />
        </Button>
      </FormActions>
    </Form>
  );
};
```

### Pluralization with FormatJS

```json
// locales/en.json
{
  "orderCount": "{count, plural, =0 {No orders} one {# order} other {# orders}}"
}
```

```tsx
import { FormattedMessage } from 'react-intl';
import { Text } from '@restorio/ui';

export const OrderCounter = ({ count }: { count: number }) => (
  <Text variant="body-md">
    <FormattedMessage id="orderCount" values={{ count }} />
  </Text>
);
```

---

## next-intl Integration

### Setup

```bash
npm install next-intl
```

### Configuration

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@restorio/ui';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const direction = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider direction={direction}>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Component Examples

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Form, FormField, FormLabel, Input, Button, FormActions } from '@restorio/ui';

export const LoginForm = () => {
  const t = useTranslations('auth');
  const tButtons = useTranslations('buttons');

  return (
    <Form>
      <FormField>
        <FormLabel required>
          {t('email')}
        </FormLabel>
        <Input
          type="email"
          placeholder={t('emailPlaceholder')}
        />
      </FormField>

      <FormActions align="end">
        <Button variant="secondary">
          {tButtons('cancel')}
        </Button>
        <Button type="submit">
          {t('login')}
        </Button>
      </FormActions>
    </Form>
  );
};
```

---

## Custom i18n Solution

### Simple Custom Hook

```typescript
// useTranslation.ts
import { createContext, useContext } from 'react';

interface Translations {
  [key: string]: string | Translations;
}

interface I18nContextValue {
  locale: string;
  translations: Translations;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
};

// Helper function to get nested translation
const getNestedTranslation = (obj: Translations, path: string): string => {
  const keys = path.split('.');
  let result: any = obj;
  
  for (const key of keys) {
    result = result?.[key];
  }
  
  return typeof result === 'string' ? result : path;
};

// Simple interpolation
const interpolate = (str: string, params: Record<string, string | number>): string => {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] || ''));
};

export const I18nProvider = ({
  children,
  locale,
  translations,
}: {
  children: React.ReactNode;
  locale: string;
  translations: Translations;
}) => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const dir = rtlLanguages.includes(locale) ? 'rtl' : 'ltr';

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedTranslation(translations, key);
    return params ? interpolate(translation, params) : translation;
  };

  return (
    <I18nContext.Provider value={{ locale, translations, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};
```

### Usage

```tsx
// App.tsx
import { I18nProvider } from './useTranslation';
import { ThemeProvider } from '@restorio/ui';
import enTranslations from './locales/en.json';

export const App = () => {
  return (
    <I18nProvider locale="en" translations={enTranslations}>
      {(i18n) => (
        <ThemeProvider direction={i18n.dir}>
          <YourApp />
        </ThemeProvider>
      )}
    </I18nProvider>
  );
};
```

```tsx
// Component.tsx
import { useTranslation } from './useTranslation';
import { Button, Input } from '@restorio/ui';

export const MyForm = () => {
  const { t } = useTranslation();

  return (
    <form>
      <Input
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
      />
      <Button type="submit">
        {t('buttons.submit')}
      </Button>
    </form>
  );
};
```

---

## RTL Support Examples

### Language Switcher with RTL Support

```tsx
import { useTranslation } from 'react-i18next';
import { Select } from '@restorio/ui';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'ar', label: 'العربية' },
    { value: 'he', label: 'עברית' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    
    // Update direction
    const isRtl = ['ar', 'he', 'fa', 'ur'].includes(newLang);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  };

  return (
    <Select
      label={t('settings.language')}
      options={languages}
      value={i18n.language}
      onChange={handleChange}
    />
  );
};
```

### RTL-Aware Layout Example

```tsx
import { useTheme } from '@restorio/ui';
import { Stack, Box } from '@restorio/ui';

export const Header = () => {
  const { direction } = useTheme();

  return (
    <Box as="header" className="border-b border-border-default">
      <Stack direction="row" align="center" justify="between" spacing="md">
        {/* Logo always on start */}
        <Logo />
        
        {/* Navigation in the middle */}
        <nav>
          <Stack direction="row" spacing="md">
            <NavLink>Home</NavLink>
            <NavLink>About</NavLink>
            <NavLink>Contact</NavLink>
          </Stack>
        </nav>
        
        {/* Actions always on end */}
        <Stack direction="row" spacing="sm">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </Stack>
      </Stack>
    </Box>
  );
};
```

---

## Common Patterns

### Dynamic Lists with Translation

```tsx
import { useTranslation } from 'react-i18next';
import { Select } from '@restorio/ui';

export const CountrySelect = () => {
  const { t } = useTranslation();

  const countries = ['us', 'ca', 'mx', 'uk', 'fr', 'de'];

  const options = countries.map(code => ({
    value: code,
    label: t(`countries.${code}`),
  }));

  return (
    <Select
      label={t('form.country')}
      placeholder={t('form.selectCountry')}
      options={options}
    />
  );
};
```

### Toast Notifications with i18n

```tsx
import { useTranslation } from 'react-i18next';
import { Toast, ToastContainer } from '@restorio/ui';

export const NotificationCenter = ({ toasts }) => {
  const { t } = useTranslation();

  return (
    <ToastContainer
      position="top-right"
      ariaLabel={t('aria.notifications')}
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={t(toast.titleKey)}
          description={t(toast.descriptionKey)}
          variant={toast.variant}
          closeButtonAriaLabel={t('aria.closeToast')}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContainer>
  );
};
```

### Order Status with Translation

```tsx
import { useTranslation } from 'react-i18next';
import { OrdersBoard, StatusColumn, OrderCard } from '@restorio/ui';

export const KitchenBoard = ({ orders }) => {
  const { t } = useTranslation();

  const statuses = ['new', 'preparing', 'ready'];

  return (
    <OrdersBoard ariaLabel={t('kitchen.boardLabel')}>
      {statuses.map(status => (
        <StatusColumn
          key={status}
          status={status}
          label={t(`kitchen.status.${status}`)}
          ariaLabel={t(`kitchen.statusColumn.${status}`)}
        >
          {orders
            .filter(order => order.status === status)
            .map(order => (
              <OrderCard
                key={order.id}
                id={order.id}
                summary={/* order summary */}
                toggleLabel={t('kitchen.toggleDetails', { id: order.id })}
                dragHandleLabel={t('kitchen.dragOrder', { id: order.id })}
                moveUpLabel={t('kitchen.moveUp')}
                moveDownLabel={t('kitchen.moveDown')}
              />
            ))}
        </StatusColumn>
      ))}
    </OrdersBoard>
  );
};
```

### Form Validation Errors

```tsx
import { useTranslation } from 'react-i18next';
import { Form, FormField, FormLabel, FormControl, Input, FormMessage } from '@restorio/ui';

export const SignupForm = () => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});

  return (
    <Form>
      <FormField>
        <FormLabel required requiredAriaLabel={t('aria.required')}>
          {t('form.email')}
        </FormLabel>
        <FormControl>
          <Input
            type="email"
            error={errors.email}
          />
        </FormControl>
        <FormMessage>
          {errors.email && t(`validation.${errors.email}`)}
        </FormMessage>
      </FormField>
    </Form>
  );
};
```

---

## Best Practices

1. **Namespace your translations** by feature or module
2. **Use dot notation** for nested keys (e.g., `auth.login`, `buttons.submit`)
3. **Separate ARIA labels** into their own namespace
4. **Keep default values** in components for fallback
5. **Test with RTL languages** regularly
6. **Use ICU message format** for complex pluralization
7. **Format dates/numbers** with `Intl` APIs
8. **Avoid string concatenation** in components
9. **Keep translations in sync** across locales
10. **Document translation keys** for translators

---

## Testing i18n

```tsx
// test-utils.tsx
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

const mockI18n = i18n.createInstance({
  lng: 'en',
  resources: {
    en: {
      translation: {
        'buttons.submit': 'Submit',
        'buttons.cancel': 'Cancel',
      },
    },
  },
});

export const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={mockI18n}>
      {component}
    </I18nextProvider>
  );
};
```

```tsx
// Component.test.tsx
import { renderWithI18n } from './test-utils';
import { LoginForm } from './LoginForm';

test('renders login form with translated labels', () => {
  const { getByText } = renderWithI18n(<LoginForm />);
  
  expect(getByText('Submit')).toBeInTheDocument();
  expect(getByText('Cancel')).toBeInTheDocument();
});
```

---

**Need more examples?** Check the [I18N_GUIDELINES.md](./I18N_GUIDELINES.md) for architectural guidance and best practices.

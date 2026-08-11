import { test, expect } from '@playwright/test'

test('сквозной сценарий: вход → выбор отеля → корзина → оплата → подтверждение', async ({ page }) => {
  // вход демо-пользователем
  await page.goto('/#/login')
  await page.getByLabel('Email').fill('user@voyago.app')
  await page.getByLabel('Пароль').fill('user123')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('link', { name: 'Мои брони' })).toBeVisible()

  // выбор отеля и добавление в корзину
  await page.goto('/#/search/hotels')
  await page.getByText('Гранд Отель Сочи').first().click()
  await expect(page.getByRole('heading', { name: 'Гранд Отель Сочи' })).toBeVisible()
  await page.getByRole('button', { name: 'В корзину' }).click()
  await page.getByRole('link', { name: /Перейти в корзину/ }).click()

  // оформление и демо-оплата
  await page.getByRole('button', { name: /Оформить/ }).click()
  await expect(page.getByRole('heading', { name: 'Оформление заказа' })).toBeVisible()
  await page.getByPlaceholder('4111 1111 1111 1111').fill('4111111111111111')
  await page.getByPlaceholder('IVAN IVANOV').fill('IVAN IVANOV')
  await page.getByPlaceholder('09/28').fill('0928')
  await page.getByPlaceholder('123').fill('123')
  await page.getByRole('button', { name: /Оплатить/ }).click()

  // подтверждение и появление брони в кабинете
  await expect(page.getByRole('heading', { name: 'Заказ оформлен!' })).toBeVisible()
  await page.goto('/#/bookings')
  await expect(page.getByText('Гранд Отель Сочи', { exact: false }).first()).toBeVisible()
})

test('избранное: сердечко сохраняет предложение на отдельной странице', async ({ page }) => {
  await page.goto('/#/search/flights')
  await page.getByRole('button', { name: 'В избранное' }).first().click()
  await page.goto('/#/favorites')
  await expect(page.getByText('В избранном пока пусто')).toHaveCount(0)
  await expect(page.getByText('Подробнее →').first()).toBeVisible()
})

test('фильтр каталога: сортировка по городу прилёта сужает выдачу', async ({ page }) => {
  await page.goto('/#/search/flights')
  await expect(page.getByText('Москва → Сочи').first()).toBeVisible()
  await page.getByPlaceholder('Город прилёта').fill('Казань')
  await expect(page.getByText('Москва → Сочи')).toHaveCount(0)
  await expect(page.getByText('Москва → Казань').first()).toBeVisible()
})

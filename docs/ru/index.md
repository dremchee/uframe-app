---
layout: home
hero:
  name: uframe
  text: "Блочный редактор страниц"
  tagline: "Добавьте полнофункциональный редактор страниц в любое приложение — лёгкий клиент и отсутствие привязки к фреймворку хоста."
  image:
    src: /uframe-logo.png
    alt: uframe
  actions:
    - theme: brand
      text: "Начать работу"
      link: /ru/guide/overview
    - theme: alt
      text: "Открыть демо"
      link: /ru/demo
    - theme: alt
      text: API reference (English)
      link: /api/
features:
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>'
    title: "Встраивание в любой стек"
    details: "Запускайте редактор как самостоятельное iframe-приложение и управляйте им из React, Vue, Svelte или обычного HTML — приложение-хост не импортирует сам редактор."
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" x2="2" y1="8" y2="22"/><line x1="17.5" x2="9" y1="15" y2="15"/></svg>'
    title: "Лёгкий клиент для хоста"
    details: "@dremchee/uframe/embed — всего несколько килобайт DOM и postMessage. В бандл хоста не попадают Vue, Tailwind и тяжёлые зависимости редактора."
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>'
    title: "Полная изоляция"
    details: "Стили и скрипты изолированы в iframe: без конфликтов CSS и с возможностью безопасно обновлять редактор за границей фрейма."
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>'
    title: "Ваши данные, ваш бэкенд"
    details: "Передайте документ редактору и получите callbacks изменений и сохранения. Храните данные там, где подходит вашему продукту."
---

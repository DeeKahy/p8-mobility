# How to use Debugger

# Debugger Logging

I debuggeren skal det være muligt at identificere, hvad der skal **logges og debugges**.

## Formål

Debuggeren skal kunne vise:

1. **Eventuelle fejl**
2. **Logging af hvad der sker i systemet**

## Eksempler på log events

- Open App  
- Loading Button component  
- Calling function with `x` og `y` argumenter  
- API POST request til server med `x` og `y` argumenter  
- Returned status code `400`

Alle logs skal vises **pænt formateret med timestamps**, så det er nemt at følge rækkefølgen af events.

## Struktur

Der skal være **to default loggere**, som altid vises øverst på debugging-siden.  
Disse loggere skal også kunne udvides med yderligere logs.

Efter disse vises **alle custom loggere**.

## UI / Visning

- Hver logger skal vises som en **dropdown / accordion**
- Indholdet skal kun blive vist, når man **udvider (view) loggeren**
- Dette gør debugging-siden mere **overskuelig og struktureret**
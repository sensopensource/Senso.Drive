import asyncio


class LogBroadcaster:
    def __init__(self):
        self.abonnes: set[asyncio.Queue] = set()
        self.loop: asyncio.AbstractEventLoop | None = None

    def s_abonner(self) -> asyncio.Queue:
        # appelee depuis la route async -> on est sur le thread de l'event loop
        self.loop = asyncio.get_running_loop()
        q = asyncio.Queue()
        self.abonnes.add(q)
        return q

    def se_desabonner(self, q: asyncio.Queue) -> None:
        self.abonnes.discard(q)

    def diffuser(self, log) -> None:
        # log_action tourne dans un thread du pool : on delegue le depot a l'event loop
        if self.loop is None:
            return
        for q in self.abonnes:
            self.loop.call_soon_threadsafe(q.put_nowait, log)


broadcaster = LogBroadcaster()

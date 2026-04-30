import corkBoardImage from '../../Animation asset/corkboard.png';
import whiteBoardImage from '../../Animation asset/whiteboard.png';

type BoardType = 'cork' | 'white';

type BoardSelectionPageProps = {
  onBack: () => void;
};

function BoardSelectionPage({ onBack }: BoardSelectionPageProps) {
  const handleBoardSelect = (board: BoardType) => {
    console.log(`Selected board: ${board}`);
  };

  const boardCards: Array<{
    id: BoardType;
    title: string;
    image: string;
    imageAlt: string;
  }> = [
    {
      id: 'cork',
      title: 'Cork board',
      image: corkBoardImage,
      imageAlt: 'Cork board placeholder',
    },
    {
      id: 'white',
      title: 'White board',
      image: whiteBoardImage,
      imageAlt: 'White board placeholder',
    },
  ];

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#eadcf8] px-6 py-10">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to landing page"
        className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/45 text-[#76627d] shadow-sm transition duration-300 ease-out hover:scale-105 hover:bg-white/65 hover:text-[#5f4b68] hover:shadow-[0_0_24px_rgba(255,153,211,0.5)] focus:outline-none focus:ring-4 focus:ring-white/80 sm:left-8 sm:top-8"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M15 6L9 12L15 18"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <section className="flex w-full max-w-4xl flex-col items-center text-center">
        <h1
          className="mb-10 text-5xl font-bold text-[#6b5b73] sm:text-6xl"
          style={{
            fontFamily:
              "'Embolism Spark', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          }}
        >
          Pick a board
        </h1>

        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          {boardCards.map((board) => (
            <button
              key={board.id}
              type="button"
              onClick={() => handleBoardSelect(board.id)}
              className="group flex h-full flex-col items-center rounded-2xl bg-white/55 p-4 transition duration-300 ease-out hover:scale-[1.03] hover:shadow-[0_0_34px_rgba(255,153,211,0.58),0_18px_38px_rgba(126,104,146,0.16)] focus:outline-none focus:ring-4 focus:ring-white/80"
            >
              <img
                src={board.image}
                alt={board.imageAlt}
                className="aspect-[4/3] w-full rounded-xl object-cover shadow-sm"
              />
              <span
                className="mt-4 text-xl font-semibold text-[#76627d] transition-colors group-hover:text-[#5f4b68]"
                style={{
                  fontFamily:
                    "'Embolism Spark', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                }}
              >
                {board.title}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default BoardSelectionPage;

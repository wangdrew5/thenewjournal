export interface Partner {
  /** Stored on pieces that credit this partner; never change one once issues use it. */
  id: string;
  name: string;
  url: string;
  /** In public/partners/. */
  logo: string;
  /**
   * A version for dark pages, for a logo whose dark lettering would disappear on them.
   * Logos with their own background or outline read anywhere and need none.
   */
  logoOnDark?: string;
  paragraphs: string[];
}

// Each write-up is laid out a little differently on purpose, so the page reads like four
// separate introductions rather than one template filled in four times.
export const partners: Partner[] = [
  {
    id: "pongo",
    name: "Pongo Poetry Project",
    url: "https://pongopoetryproject.org/",
    logo: "pongo-poetry-project.webp",
    logoOnDark: "pongo-poetry-project-light.webp",
    paragraphs: [
      "The Pongo Poetry Project is a Seattle-based nonprofit that helps incarcerated and trauma-impacted youth express themselves through poetry. Through writing workshops in juvenile detention centers, psychiatric hospitals, and other facilities, Pongo gives young people a space to process their experiences and share their stories. The organization also publishes collections of poetry written by participants, allowing their voices to reach people outside these facilities.",
      "Through writing workshops, participants explore their emotions, reflect on their lives, and put their stories into words. Their poetry gives readers a chance to hear perspectives that are often overlooked and better understand the people behind them.",
      "If you’d like to support Pongo, one of the most direct ways is to become a poetry mentor and sit with young writers as they put their experiences into words. Donations help keep those workshops going in detention centers and hospitals. Reading the poetry collections Pongo publishes, and passing them on to someone else, helps these voices travel a little further. And if you want to bring this kind of writing into your own community, Pongo offers training for that too.",
    ],
  },
  {
    id: "share",
    name: "SHARE Screenwriting",
    url: "https://sharescreenwriting.com/",
    logo: "share-screenwriting.webp",
    paragraphs: [
      "SHARE Screenwriting gives incarcerated women and youth the opportunity to tell their stories through filmmaking. Participants work on screenplays and short films that reflect their experiences, challenges, and perspectives. Their work encourages audiences to see incarcerated individuals beyond their circumstances and recognize the people and stories behind each film.",
      "Founded in 2019, the Washington-based program offers screenwriting workshops where participants learn to write scripts, develop stories, and collaborate on film projects. SHARE has worked with facilities such as Echo Glen Children’s Center and Green Hill School, as well as other creative organizations, to turn participants’ writing into short films. Through its films, SHARE hopes to help audiences better understand the experiences of incarcerated individuals.",
      "The simplest way to support SHARE is to watch the films. A screening is where a participant’s story finally meets an audience, so showing up matters more than it might seem. Passing SHARE’s projects along to friends widens that audience, and donations help the workshops continue. If you work in film, education, or another creative field, SHARE is also glad to hear from people interested in collaborating.",
    ],
  },
  {
    id: "unincarcerated",
    name: "Unincarcerated Productions",
    url: "https://www.unincarcerated.org/",
    logo: "unincarcerated-productions.webp",
    paragraphs: [
      "Unincarcerated Productions is a Washington-based media organization that works with incarcerated and formerly incarcerated individuals through filmmaking, podcasts, and digital storytelling. Its programs, including Inside/Out Media Labs, teach participants skills in video production, interviewing, and other forms of media, helping them build creative and professional skills that can create opportunities after incarceration.",
      "The organization also produces projects such as Concrete Mama: The Podcast, which shares stories and conversations from inside Washington State Penitentiary. Through its programs, participants produce work that reflects their own experiences, giving audiences a closer look at life during and after incarceration, told by the people who have experienced it themselves.",
      "Supporting Unincarcerated can start with something as easy as pressing play. Watching its films, listening to Concrete Mama, and sharing them with people you know helps these stories reach past prison walls. Donations go toward programs that teach participants their craft, along with skills that can open doors once they’re home. Organizations and creators who want to work together can also reach out about collaborating.",
    ],
  },
  {
    id: "bridge",
    name: "The Bridge Music Project",
    url: "https://www.bridgemusicproject.org/",
    logo: "bridge-music-project.webp",
    paragraphs: [
      "The Bridge Music Project is a Washington-based nonprofit that helps young people express themselves through music. Through songwriting workshops, the organization works with youth from different backgrounds, including those in juvenile detention facilities such as Green Hill School and Echo Glen Children’s Center.",
      "Participants collaborate with musicians and mentors to write original songs based on their experiences, emotions, and ideas, then record their music while developing skills in communication and teamwork. Their music offers a way to express thoughts that can be difficult to put into words, while giving listeners a chance to connect with their stories.",
      "Want to help? The Bridge welcomes volunteers in a lot of different roles, from mentors who write alongside young people to photographers and videographers who capture the work as it happens. Event volunteers help the performances come together. Donations keep every workshop free, so no one has to pay to take part. Or simply come to a show: hearing participants perform songs they wrote themselves, and sharing that music afterward, is one of the best ways to help their work reach a wider audience.",
    ],
  },
];

export const partnerById = (id: string | undefined) =>
  id ? partners.find((partner) => partner.id === id) : undefined;

/** A partner's logo, under the site's base path. */
export const partnerLogoUrl = (partner: Partner, onDark = false) =>
  `${import.meta.env.BASE_URL}partners/${(onDark && partner.logoOnDark) || partner.logo}`;

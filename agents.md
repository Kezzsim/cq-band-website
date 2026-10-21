# Carrion Queen Band Website

- This replaces an [existing repository](https://github.com/Kezzsim/cq-band-website).
- This needs to be a static site capable of being served via github pages.
- This needs to be a modern progressive web application that is installable and capable of playing music in the background.
- There will be a calendar .json file with information about upcoming gigs, this will be parsed into a calendar that shows only months where upcoming events are planned and if there are no events the component does not render / remains hidden.
- Utilize lazy loading wherever possible, paint the animated `Logo.webp` to screen as soon as you can since it can suffice as a loading animation (somewhat). It only plays once and then sits there.
- This website needs to be fully responsive, even though it basically consists of one column of contents, there are two available resolutions for the background video. 16x9 and 9x16. Use adequite breakpoints to switch between them and try to prevent gaps in playback on a desktop or ipad where someone might be manipulating the window size if possible.
- This should have a very grunge aesthetic overall, svgs generated for calendars and other graphics should have freyed edges and evoke a punk style.
- The music player needs to have a download button to grab the `.mp3` files it plays.
- The music player needs to support a playlist consisting of whatever mp3s are in the music directory.
- The music player should be accompanied by an animation of a cassette tape which spins while playing.
- The logo webp needs to stay centered in the responsive layout.
- In the existing source code there are links to social media. Right now there is Bluesky and Instagram, but we need to add our [YouTube channel](https://www.youtube.com/@queencarrion).
- Upon scrolling up the video background should stay stationary. The logo should lock in place at the top and maybe shrink a little while the calendar and music player, and social links come into view.
- The music player needs to display the id3 tag data of the tracks, but not the album art.
- The music player needs play / pause / stop / next track controls.
- `cq-fg.png` is a transparent image of a coyote, let's have it appear on the screen in the bottom right beneath other components but above the background video and then slide out of view to the left as the user scrolls down. Somewhat the opposite of what it was originally doing.
- Let's use OpenStreetMap or something where we don't have API rate limiting problems to display the gig map.
- SVGs should be single color, high contrast like white for things like the calendar, music player e.g.

## Typography

Example Google font reference block:

```html
<link href="https://fonts.googleapis.com/css2?family=Jolly+Lodger&family=Pirata+One&family=UnifrakturCook:wght@700&display=swap" rel="stylesheet">
```

- *UnifrakturCook* is for Titles, Headings e.g.
- *Pirata One* is for the majority of body texts et. al.
- *Jolly Lodger* is for flavor texts, callouts e.g.

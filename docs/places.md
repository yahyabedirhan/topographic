# Places

The playground's Map menu holds 108 real places, grouped by continent.
Ten of them are built into the library as `topographic/locations` ids, and the other 98 belong to the playground.
Search the menu by a place's name, its note, its country, its continent or its kind.
A link opens any of them with `?place=<id>`, such as `https://topographic.yahyapak.dev/?place=fitz-roy`.

## Grids

The ten built-in places load their grids from the library, as `loadLocation(id)` does.
Each of the other places has a pre-rendered 256 × 256 16-bit greyscale PNG in `apps/playground/public/places/<id>.png`, served as a static file.
`scripts/places.mjs` makes these files with the library's own pipeline and the settings of `fetchLocation()`: dramatic relief and medium smoothing.
It also writes each place's lowest and highest point and its tile zoom into `apps/playground/src/region/catalog.json`.
When a grid file cannot be read, the playground reads the place from the elevation tiles instead, as it does for any framed area.

To add a place, add its row to `catalog.json` with an `id`, `name`, `description`, `country`, `continent`, `kind` and `bbox`.
Then run `node scripts/places.mjs <id>` and commit the new PNG and the updated catalog.

## Limitations

- Antarctic heights in the elevation tiles are coarse: Vinson reads about 4,240 m and Mount Erebus about 3,130 m, below their real heights.
- Deception Island and the Lemaire Channel show little sea-floor depth, so their water draws flat.
- Ilulissat Icefjord has gentle relief from the ice sheet, about 480 m in its box.
- Uluru & Kata Tjuta has about 550 m of relief in its box, and reads best with a low elevation.
- Lake Titicaca and the Dead Sea are shown by the land around them, without lake-bed depths. The pipeline draws land below sea level as sea, so the Dead Sea's shore and water are flat at 0 m.

## The list

Sizes are the box's width and height.

### Europe

| Place | Country | Kind | Size | Id |
|---|---|---|---|---|
| Istanbul (built in) | Turkey | city | 101 × 64 km | `istanbul` |
| Cyprus (built in) | Cyprus | island | 261 × 166 km | `cyprus` |
| Matterhorn & Zermatt (built in) | Switzerland | mountain | 40 × 26 km | `matterhorn` |
| Geirangerfjord (built in) | Norway | fjord | 60 × 39 km | `geirangerfjord` |
| Mont Blanc | France / Italy | mountain | 42 × 28 km | `mont-blanc` |
| The Dolomites | Italy | mountain | 54 × 36 km | `dolomites` |
| Mount Etna | Italy | volcano | 45 × 38 km | `etna` |
| Naples & Vesuvius | Italy | city | 54 × 36 km | `naples-vesuvius` |
| Grossglockner | Austria | glacier | 33 × 22 km | `grossglockner` |
| Triglav & the Julian Alps | Slovenia | mountain | 36 × 24 km | `triglav` |
| High Tatras | Slovakia / Poland | mountain | 42 × 28 km | `high-tatras` |
| Bay of Kotor | Montenegro | coast | 33 × 24 km | `bay-of-kotor` |
| Santorini | Greece | crater | 22 × 18 km | `santorini` |
| Tenerife & Teide | Spain | volcano | 95 × 72 km | `teide` |
| Madeira | Portugal | island | 72 × 40 km | `madeira` |
| Isle of Skye | United Kingdom | island | 45 × 32 km | `skye` |
| Faroe Islands | Denmark | island | 95 × 125 km | `faroe-islands` |
| Lofoten | Norway | island | 120 × 60 km | `lofoten` |
| Mount Elbrus | Russia | volcano | 36 × 26 km | `elbrus` |

### Middle East

| Place | Country | Kind | Size | Id |
|---|---|---|---|---|
| Mount Ararat | Turkey | volcano | 54 × 36 km | `ararat` |
| Dead Sea | Israel / Jordan / Palestine | lake | 50 × 90 km | `dead-sea` |
| Wadi Rum | Jordan | desert | 40 × 30 km | `wadi-rum` |
| Mount Damavand | Iran | volcano | 40 × 28 km | `damavand` |
| Musandam | Oman | coast | 54 × 72 km | `musandam` |
| Socotra | Yemen | island | 140 × 55 km | `socotra` |

### Africa

| Place | Country | Kind | Size | Id |
|---|---|---|---|---|
| Kilimanjaro (built in) | Tanzania | volcano | 80 × 52 km | `kilimanjaro` |
| Ngorongoro Crater | Tanzania | crater | 45 × 32 km | `ngorongoro` |
| Mount Kenya | Kenya | mountain | 45 × 32 km | `mount-kenya` |
| Rwenzori Mountains | Uganda / DR Congo | mountain | 42 × 32 km | `rwenzori` |
| Virunga Volcanoes | DR Congo / Rwanda | volcano | 60 × 42 km | `virunga` |
| Simien Mountains | Ethiopia | mountain | 48 × 32 km | `simien` |
| Toubkal & the High Atlas | Morocco | mountain | 40 × 28 km | `toubkal` |
| Hoggar Mountains | Algeria | desert | 60 × 42 km | `hoggar` |
| Emi Koussi, Tibesti | Chad | volcano | 80 × 56 km | `tibesti` |
| Réunion | France | island | 80 × 62 km | `reunion` |
| Drakensberg Amphitheatre | South Africa / Lesotho | mountain | 40 × 28 km | `drakensberg` |
| Cape Town & Table Mountain | South Africa | city | 36 × 56 km | `cape-town` |
| Sossusvlei | Namibia | desert | 50 × 34 km | `sossusvlei` |

### Asia

| Place | Country | Kind | Size | Id |
|---|---|---|---|---|
| Mount Fuji (built in) | Japan | volcano | 52 × 34 km | `fuji` |
| Everest (built in) | Nepal / China | mountain | 33 × 21 km | `everest` |
| Annapurna Sanctuary | Nepal | mountain | 50 × 34 km | `annapurna` |
| K2 & the Baltoro | Pakistan / China | glacier | 60 × 40 km | `k2` |
| Nanda Devi | India | mountain | 45 × 32 km | `nanda-devi` |
| Tiger Leaping Gorge | China | canyon | 36 × 24 km | `tiger-leaping-gorge` |
| Guilin & Yangshuo | China | karst | 40 × 56 km | `guilin-yangshuo` |
| Hong Kong | China | city | 60 × 40 km | `hong-kong` |
| Taroko Gorge | Taiwan | canyon | 42 × 28 km | `taroko` |
| Jeju & Hallasan | South Korea | island | 85 × 45 km | `jeju` |
| Hạ Long Bay | Vietnam | karst | 48 × 32 km | `halong-bay` |
| Mount Kinabalu | Malaysia | mountain | 36 × 24 km | `kinabalu` |
| Bromo & Semeru | Indonesia | volcano | 42 × 30 km | `bromo-semeru` |
| Mayon Volcano | Philippines | volcano | 30 × 22 km | `mayon` |
| Klyuchevskaya Sopka | Russia | volcano | 75 × 50 km | `klyuchevskaya` |
| Khan Tengri | Kazakhstan / Kyrgyzstan | glacier | 60 × 40 km | `khan-tengri` |
| Ismoil Somoni Peak | Tajikistan | glacier | 60 × 42 km | `ismoil-somoni` |

### Oceania

| Place | Country | Kind | Size | Id |
|---|---|---|---|---|
| Aoraki / Mount Cook | New Zealand | glacier | 45 × 32 km | `aoraki` |
| Milford Sound | New Zealand | fjord | 40 × 28 km | `milford-sound` |
| Tongariro | New Zealand | volcano | 45 × 34 km | `tongariro` |
| Uluru & Kata Tjuta | Australia | desert | 45 × 30 km | `uluru` |
| Blue Mountains | Australia | canyon | 48 × 34 km | `blue-mountains` |
| Lord Howe Island | Australia | island | 18 × 24 km | `lord-howe` |
| Puncak Jaya | Indonesia | mountain | 45 × 30 km | `puncak-jaya` |
| Bora Bora | France | island | 22 × 20 km | `bora-bora` |
| Mauna Kea & Mauna Loa | United States | volcano | 110 × 80 km | `mauna-kea` |
| Kauaʻi | United States | island | 60 × 45 km | `kauai` |
| Rapa Nui | Chile | island | 30 × 22 km | `rapa-nui` |

### North America

| Place | Country | Kind | Size | Id |
|---|---|---|---|---|
| Grand Canyon (built in) | United States | canyon | 60 × 39 km | `grand-canyon` |
| Yosemite Valley (built in) | United States | valley | 30 × 19 km | `yosemite` |
| Denali | United States | mountain | 60 × 40 km | `denali` |
| Mount Rainier | United States | volcano | 42 × 30 km | `mount-rainier` |
| Crater Lake | United States | crater | 27 × 20 km | `crater-lake` |
| Grand Teton | United States | mountain | 34 × 46 km | `grand-teton` |
| Death Valley | United States | desert | 54 × 72 km | `death-valley` |
| Lake Louise & Moraine Lake | Canada | lake | 36 × 26 km | `banff` |
| Vancouver & Howe Sound | Canada | city | 60 × 42 km | `vancouver` |
| Copper Canyon | Mexico | canyon | 54 × 38 km | `copper-canyon` |
| Popocatépetl & Iztaccíhuatl | Mexico | volcano | 36 × 48 km | `popocatepetl` |
| Lake Atitlán | Guatemala | lake | 40 × 30 km | `atitlan` |
| The Pitons | Saint Lucia | coast | 20 × 15 km | `pitons` |

### South America

| Place | Country | Kind | Size | Id |
|---|---|---|---|---|
| Torres del Paine (built in) | Chile | mountain | 60 × 39 km | `torres-del-paine` |
| Fitz Roy & Cerro Torre | Argentina | mountain | 40 × 27 km | `fitz-roy` |
| Perito Moreno Glacier | Argentina | glacier | 45 × 30 km | `perito-moreno` |
| Aconcagua | Argentina | mountain | 45 × 30 km | `aconcagua` |
| Ushuaia & the Beagle Channel | Argentina | city | 60 × 40 km | `ushuaia` |
| Licancabur & the Atacama | Chile / Bolivia | volcano | 45 × 32 km | `licancabur` |
| La Paz & Illimani | Bolivia | city | 60 × 40 km | `la-paz` |
| Lake Titicaca | Peru / Bolivia | lake | 165 × 155 km | `titicaca` |
| Machu Picchu | Peru | mountain | 30 × 22 km | `machu-picchu` |
| Colca Canyon | Peru | canyon | 48 × 32 km | `colca-canyon` |
| Huascarán & the Cordillera Blanca | Peru | mountain | 40 × 54 km | `cordillera-blanca` |
| Cotopaxi | Ecuador | volcano | 40 × 28 km | `cotopaxi` |
| Isabela & Fernandina | Ecuador | volcano | 110 × 140 km | `galapagos` |
| Sierra Nevada de Santa Marta | Colombia | mountain | 90 × 60 km | `santa-marta` |
| Mount Roraima | Venezuela / Brazil / Guyana | mountain | 36 × 26 km | `roraima` |
| Auyán-tepui & Angel Falls | Venezuela | mountain | 54 × 45 km | `auyan-tepui` |
| Rio de Janeiro | Brazil | city | 54 × 36 km | `rio-de-janeiro` |

### Antarctica

| Place | Country | Kind | Size | Id |
|---|---|---|---|---|
| McMurdo Dry Valleys | Antarctica | valley | 90 × 60 km | `dry-valleys` |
| Mount Erebus | Antarctica | volcano | 80 × 55 km | `mount-erebus` |
| Vinson Massif | Antarctica | mountain | 60 × 42 km | `vinson` |
| Lemaire Channel | Antarctica | coast | 54 × 38 km | `lemaire-channel` |
| Deception Island | Antarctica | crater | 20 × 18 km | `deception-island` |
| South Georgia | United Kingdom | island | 110 × 70 km | `south-georgia` |

### Arctic

| Place | Country | Kind | Size | Id |
|---|---|---|---|---|
| Vatnajökull | Iceland | glacier | 160 × 110 km | `vatnajokull` |
| Eyjafjallajökull & Mýrdalsjökull | Iceland | volcano | 72 × 45 km | `eyjafjallajokull` |
| Isfjorden, Svalbard | Norway | fjord | 110 × 70 km | `svalbard` |
| Ilulissat Icefjord | Greenland | glacier | 90 × 60 km | `ilulissat` |
| Scoresby Sund | Greenland | fjord | 150 × 100 km | `scoresby-sund` |
| Mount Thor, Baffin Island | Canada | valley | 54 × 40 km | `mount-thor` |

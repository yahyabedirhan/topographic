# Places

The playground's Map menu holds 108 real places, grouped by continent.
Ten of them are built into the library as `topographic/locations` ids, and the other 98 belong to the playground.
Each row in the menu names the place, then its country and what it is in a few words; a place that is a whole country or territory, such as Cyprus, skips the country.
Search the menu by a place's name, that line, its country, its continent or its kind.
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

| Place | Country | What it is | Kind | Size | Id |
|---|---|---|---|---|---|
| Istanbul (built in) | Turkey | The city on the Bosphorus | city | 101 × 64 km | `istanbul` |
| Cyprus (built in) | Cyprus | The whole island, mountains to coast | island | 261 × 166 km | `cyprus` |
| Matterhorn & Zermatt (built in) | Switzerland | The famous pyramid peak | mountain | 40 × 26 km | `matterhorn` |
| Geirangerfjord (built in) | Norway | A deep fjord with steep walls | fjord | 60 × 39 km | `geirangerfjord` |
| Mont Blanc | France / Italy | The Alps' highest peak | mountain | 42 × 28 km | `mont-blanc` |
| The Dolomites | Italy | Pale rock towers | mountain | 54 × 36 km | `dolomites` |
| Mount Etna | Italy | Europe's tallest active volcano | volcano | 45 × 38 km | `etna` |
| Naples & Vesuvius | Italy | A bay city under a volcano | city | 54 × 36 km | `naples-vesuvius` |
| Grossglockner | Austria | The country's highest peak | glacier | 33 × 22 km | `grossglockner` |
| Triglav & the Julian Alps | Slovenia | The country's highest peak | mountain | 36 × 24 km | `triglav` |
| High Tatras | Slovakia / Poland | A sharp granite range | mountain | 42 × 28 km | `high-tatras` |
| Bay of Kotor | Montenegro | A bay deep in the mountains | coast | 33 × 24 km | `bay-of-kotor` |
| Santorini | Greece | A flooded volcano crater | crater | 22 × 18 km | `santorini` |
| Tenerife & Teide | Spain | A giant volcano island | volcano | 95 × 72 km | `teide` |
| Madeira | Portugal | A steep volcanic island | island | 72 × 40 km | `madeira` |
| Isle of Skye | United Kingdom | A rugged island of black peaks | island | 45 × 32 km | `skye` |
| Faroe Islands | Denmark | Islands of sheer sea cliffs | island | 95 × 125 km | `faroe-islands` |
| Lofoten | Norway | Peaks rising from the sea | island | 120 × 60 km | `lofoten` |
| Mount Elbrus | Russia | Europe's highest peak | volcano | 36 × 26 km | `elbrus` |

### Middle East

| Place | Country | What it is | Kind | Size | Id |
|---|---|---|---|---|---|
| Mount Ararat | Turkey | A great lone volcano | volcano | 54 × 36 km | `ararat` |
| Dead Sea | Israel / Jordan / Palestine | The lowest land on Earth | lake | 50 × 90 km | `dead-sea` |
| Wadi Rum | Jordan | Red desert mountains | desert | 40 × 30 km | `wadi-rum` |
| Mount Damavand | Iran | A lone volcano near Tehran | volcano | 40 × 28 km | `damavand` |
| Musandam | Oman | Fjord-like inlets by the sea | coast | 54 × 72 km | `musandam` |
| Socotra | Yemen | A remote island of high peaks | island | 140 × 55 km | `socotra` |

### Africa

| Place | Country | What it is | Kind | Size | Id |
|---|---|---|---|---|---|
| Kilimanjaro (built in) | Tanzania | Africa's highest peak | volcano | 80 × 52 km | `kilimanjaro` |
| Ngorongoro Crater | Tanzania | A huge volcanic crater | crater | 45 × 32 km | `ngorongoro` |
| Mount Kenya | Kenya | An old worn volcano | mountain | 45 × 32 km | `mount-kenya` |
| Rwenzori Mountains | Uganda / DR Congo | Snowy equator peaks | mountain | 42 × 32 km | `rwenzori` |
| Virunga Volcanoes | DR Congo / Rwanda | A chain of volcanoes | volcano | 60 × 42 km | `virunga` |
| Simien Mountains | Ethiopia | High cliffs and pinnacles | mountain | 48 × 32 km | `simien` |
| Toubkal & the High Atlas | Morocco | North Africa's highest peak | mountain | 40 × 28 km | `toubkal` |
| Hoggar Mountains | Algeria | Volcanic peaks in the Sahara | desert | 60 × 42 km | `hoggar` |
| Emi Koussi, Tibesti | Chad | The Sahara's highest volcano | volcano | 80 × 56 km | `tibesti` |
| Réunion | France | A volcanic island in the Indian Ocean | island | 80 × 62 km | `reunion` |
| Drakensberg Amphitheatre | South Africa / Lesotho | A great wall of rock | mountain | 40 × 28 km | `drakensberg` |
| Cape Town & Table Mountain | South Africa | The city under Table Mountain | city | 36 × 56 km | `cape-town` |
| Sossusvlei | Namibia | The tallest red dunes | desert | 50 × 34 km | `sossusvlei` |

### Asia

| Place | Country | What it is | Kind | Size | Id |
|---|---|---|---|---|---|
| Mount Fuji (built in) | Japan | The famous volcano cone | volcano | 52 × 34 km | `fuji` |
| Everest (built in) | Nepal / China | The world's highest peak | mountain | 33 × 21 km | `everest` |
| Annapurna Sanctuary | Nepal | A ring of giant peaks | mountain | 50 × 34 km | `annapurna` |
| K2 & the Baltoro | Pakistan / China | The world's second peak | glacier | 60 × 40 km | `k2` |
| Nanda Devi | India | A peak inside a ring of walls | mountain | 45 × 32 km | `nanda-devi` |
| Tiger Leaping Gorge | China | A deep river gorge | canyon | 36 × 24 km | `tiger-leaping-gorge` |
| Guilin & Yangshuo | China | Rock towers along a river | karst | 40 × 56 km | `guilin-yangshuo` |
| Hong Kong | China | A harbour city among green hills | city | 60 × 40 km | `hong-kong` |
| Taroko Gorge | Taiwan | A marble gorge to the sea | canyon | 42 × 28 km | `taroko` |
| Jeju & Hallasan | South Korea | A volcanic island | island | 85 × 45 km | `jeju` |
| Hạ Long Bay | Vietnam | A bay of rock islands | karst | 48 × 32 km | `halong-bay` |
| Mount Kinabalu | Malaysia | Borneo's highest peak | mountain | 36 × 24 km | `kinabalu` |
| Bromo & Semeru | Indonesia | Smoking volcanoes in a sand sea | volcano | 42 × 30 km | `bromo-semeru` |
| Mayon Volcano | Philippines | A near-perfect volcano cone | volcano | 30 × 22 km | `mayon` |
| Klyuchevskaya Sopka | Russia | Kamchatka's highest volcano | volcano | 75 × 50 km | `klyuchevskaya` |
| Khan Tengri | Kazakhstan / Kyrgyzstan | A marble pyramid peak | glacier | 60 × 40 km | `khan-tengri` |
| Ismoil Somoni Peak | Tajikistan | The Pamir's highest peak | glacier | 60 × 42 km | `ismoil-somoni` |

### Oceania

| Place | Country | What it is | Kind | Size | Id |
|---|---|---|---|---|---|
| Aoraki / Mount Cook | New Zealand | The country's highest peak | glacier | 45 × 32 km | `aoraki` |
| Milford Sound | New Zealand | A fjord under steep peaks | fjord | 40 × 28 km | `milford-sound` |
| Tongariro | New Zealand | Three volcanoes together | volcano | 45 × 34 km | `tongariro` |
| Uluru & Kata Tjuta | Australia | Two great desert rocks | desert | 45 × 30 km | `uluru` |
| Blue Mountains | Australia | Sandstone cliffs and valleys | canyon | 48 × 34 km | `blue-mountains` |
| Lord Howe Island | Australia | A small island with twin peaks | island | 18 × 24 km | `lord-howe` |
| Puncak Jaya | Indonesia | Oceania's highest peak | mountain | 45 × 30 km | `puncak-jaya` |
| Bora Bora | France | An island in a lagoon | island | 22 × 20 km | `bora-bora` |
| Mauna Kea & Mauna Loa | United States | The largest volcanoes on Earth | volcano | 110 × 80 km | `mauna-kea` |
| Kauaʻi | United States | An island of sea cliffs | island | 60 × 45 km | `kauai` |
| Rapa Nui | Chile | Easter Island and its volcanoes | island | 30 × 22 km | `rapa-nui` |

### North America

| Place | Country | What it is | Kind | Size | Id |
|---|---|---|---|---|---|
| Grand Canyon (built in) | United States | A vast desert canyon | canyon | 60 × 39 km | `grand-canyon` |
| Yosemite Valley (built in) | United States | A granite valley | valley | 30 × 19 km | `yosemite` |
| Denali | United States | North America's highest peak | mountain | 60 × 40 km | `denali` |
| Mount Rainier | United States | A volcano wrapped in ice | volcano | 42 × 30 km | `mount-rainier` |
| Crater Lake | United States | A lake in an old volcano | crater | 27 × 20 km | `crater-lake` |
| Grand Teton | United States | A sharp mountain wall | mountain | 34 × 46 km | `grand-teton` |
| Death Valley | United States | The hottest, lowest desert | desert | 54 × 72 km | `death-valley` |
| Lake Louise & Moraine Lake | Canada | Blue lakes under the Rockies | lake | 36 × 26 km | `banff` |
| Vancouver & Howe Sound | Canada | A city between sea and mountains | city | 60 × 42 km | `vancouver` |
| Copper Canyon | Mexico | A maze of deep canyons | canyon | 54 × 38 km | `copper-canyon` |
| Popocatépetl & Iztaccíhuatl | Mexico | Twin volcanoes | volcano | 36 × 48 km | `popocatepetl` |
| Lake Atitlán | Guatemala | A lake ringed by volcanoes | lake | 40 × 30 km | `atitlan` |
| The Pitons | Saint Lucia | Two volcanic peaks by the sea | coast | 20 × 15 km | `pitons` |

### South America

| Place | Country | What it is | Kind | Size | Id |
|---|---|---|---|---|---|
| Torres del Paine (built in) | Chile | Granite towers and glacial lakes | mountain | 60 × 39 km | `torres-del-paine` |
| Fitz Roy & Cerro Torre | Argentina | Granite spires in Patagonia | mountain | 40 × 27 km | `fitz-roy` |
| Perito Moreno Glacier | Argentina | A glacier flowing into a lake | glacier | 45 × 30 km | `perito-moreno` |
| Aconcagua | Argentina | The Americas' highest peak | mountain | 45 × 30 km | `aconcagua` |
| Ushuaia & the Beagle Channel | Argentina | The world's southernmost city | city | 60 × 40 km | `ushuaia` |
| Licancabur & the Atacama | Chile / Bolivia | A volcano in the desert | volcano | 45 × 32 km | `licancabur` |
| La Paz & Illimani | Bolivia | A city in a high canyon | city | 60 × 40 km | `la-paz` |
| Lake Titicaca | Peru / Bolivia | A great high lake | lake | 165 × 155 km | `titicaca` |
| Machu Picchu | Peru | The Inca city on a ridge | mountain | 30 × 22 km | `machu-picchu` |
| Colca Canyon | Peru | One of the deepest canyons | canyon | 48 × 32 km | `colca-canyon` |
| Huascarán & the Cordillera Blanca | Peru | The highest tropical peaks | mountain | 40 × 54 km | `cordillera-blanca` |
| Cotopaxi | Ecuador | A snowy volcano | volcano | 40 × 28 km | `cotopaxi` |
| Isabela & Fernandina | Ecuador | The Galápagos volcanoes | volcano | 110 × 140 km | `galapagos` |
| Sierra Nevada de Santa Marta | Colombia | Snowy peaks by the sea | mountain | 90 × 60 km | `santa-marta` |
| Mount Roraima | Venezuela / Brazil / Guyana | A flat-topped mountain | mountain | 36 × 26 km | `roraima` |
| Auyán-tepui & Angel Falls | Venezuela | The world's highest waterfall | mountain | 54 × 45 km | `auyan-tepui` |
| Rio de Janeiro | Brazil | A city of peaks and beaches | city | 54 × 36 km | `rio-de-janeiro` |

### Antarctica

| Place | Country | What it is | Kind | Size | Id |
|---|---|---|---|---|---|
| McMurdo Dry Valleys | Antarctica | Valleys without ice | valley | 90 × 60 km | `dry-valleys` |
| Mount Erebus | Antarctica | The southernmost active volcano | volcano | 80 × 55 km | `mount-erebus` |
| Vinson Massif | Antarctica | The continent's highest peak | mountain | 60 × 42 km | `vinson` |
| Lemaire Channel | Antarctica | A narrow channel between peaks | coast | 54 × 38 km | `lemaire-channel` |
| Deception Island | Antarctica | A flooded volcano | crater | 20 × 18 km | `deception-island` |
| South Georgia | United Kingdom | An island of glaciers and peaks | island | 110 × 70 km | `south-georgia` |

### Arctic

| Place | Country | What it is | Kind | Size | Id |
|---|---|---|---|---|---|
| Vatnajökull | Iceland | Europe's largest ice cap | glacier | 160 × 110 km | `vatnajokull` |
| Eyjafjallajökull & Mýrdalsjökull | Iceland | Two volcanoes under ice | volcano | 72 × 45 km | `eyjafjallajokull` |
| Isfjorden, Svalbard | Norway | Flat-topped peaks and glaciers | fjord | 110 × 70 km | `svalbard` |
| Ilulissat Icefjord | Greenland | A fjord full of icebergs | glacier | 90 × 60 km | `ilulissat` |
| Scoresby Sund | Greenland | The world's largest fjord | fjord | 150 × 100 km | `scoresby-sund` |
| Mount Thor, Baffin Island | Canada | The world's tallest sheer cliff | valley | 54 × 40 km | `mount-thor` |

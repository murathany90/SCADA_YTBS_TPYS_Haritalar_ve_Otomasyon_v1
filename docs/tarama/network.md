{
    "result": [
        {
            "cache_key": "14f3d1af98f23450c23bf188b5ceb1d4",
            "cached_dttm": "2026-04-19T20:56:22",
            "cache_timeout": 3600,
            "applied_template_filters": [],
            "annotation_data": {},
            "error": null,
            "is_cached": true,
            "query": "SELECT \"sinsid\" AS \"sinsid\",\n       \"b1Name\" AS \"b1Name\",\n       \"b2Name\" AS \"b2Name\",\n       \"b3Name\" AS \"b3Name\",\n       \"elementName\" AS \"elementName\",\n       max(\"__time\") AS \"MAX(__time)\",\n       AVG(\"maxValue\") AS \"AVG(maxValue)\"\nFROM \"druid\".\"teias-analog-aggregate\"\nWHERE \"__time\" >= '2026-04-18 23:56:17.000000'\n  AND \"__time\" < '2026-04-19 23:56:17.000000'\n  AND \"elementName\" = 'P'\n  AND \"b2Name\" IN ('400',\n                   '380',\n                   '420',\n                   '154')\n  AND \"tear\" IN ('Golbasi_YTM')\nGROUP BY \"sinsid\",\n         \"b1Name\",\n         \"b2Name\",\n         \"b3Name\",\n         \"elementName\"\nORDER BY max(\"maxValue\") DESC\nLIMIT 50000;\n\n",
            "status": "success",
            "stacktrace": null,
            "rowcount": 852,
            "from_dttm": 1776556656000.0,
            "to_dttm": 1776643056000.0,
            "label_map": {
                "sinsid": [
                    "sinsid"
                ],
                "b1Name": [
                    "b1Name"
                ],
                "b2Name": [
                    "b2Name"
                ],
                "b3Name": [
                    "b3Name"
                ],
                "elementName": [
                    "elementName"
                ],
                "MAX(__time)": [
                    "MAX(__time)"
                ],
                "AVG(maxValue)": [
                    "AVG(maxValue)"
                ]
            },
            "colnames": [
                "sinsid",
                "b1Name",
                "b2Name",
                "b3Name",
                "elementName",
                "MAX(__time)",
                "AVG(maxValue)"
            ],
            "indexnames": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18,
                19,
                20,
                21,
                22,
                23,
                24,
                25,
                26,
                27,
                28,
                29,
                30,
                31,
                32,
                33,
                34,
                35,
                36,
                37,
                38,
                39,
                40,
                41,
                42,
                43,
                44,
                45,
                46,
                47,
                48,
                49,
                50,
                51,
                52,
                53,
                54,
                55,
                56,
                57,
                58,
                59,
                60,
                61,
                62,
                63,
                64,
                65,
                66,
                67,
                68,
                69,
                70,
                71,
                72,
                73,
                74,
                75,
                76,
                77,
                78,
                79,
                80,
                81,
                82,
                83,
                84,
                85,
                86,
                87,
                88,
                89,
                90,
                91,
                92,
                93,
                94,
                95,
                96,
                97,
                98,
                99,
                100,
                101,
                102,
                103,
                104,
                105,
                106,
                107,
                108,
                109,
                110,
                111,
                112,
                113,
                114,
                115,
                116,
                117,
                118,
                119,
                120,
                121,
                122,
                123,
                124,
                125,
                126,
                127,
                128,
                129,
                130,
                131,
                132,
                133,
                134,
                135,
                136,
                137,
                138,
                139,
                140,
                141,
                142,
                143,
                144,
                145,
                146,
                147,
                148,
                149,
                150,
                151,
                152,
                153,
                154,
                155,
                156,
                157,
                158,
                159,
                160,
                161,
                162,
                163,
                164,
                165,
                166,
                167,
                168,
                169,
                170,
                171,
                172,
                173,
                174,
                175,
                176,
                177,
                178,
                179,
                180,
                181,
                182,
                183,
                184,
                185,
                186,
                187,
                188,
                189,
                190,
                191,
                192,
                193,
                194,
                195,
                196,
                197,
                198,
                199,
                200,
                201,
                202,
                203,
                204,
                205,
                206,
                207,
                208,
                209,
                210,
                211,
                212,
                213,
                214,
                215,
                216,
                217,
                218,
                219,
                220,
                221,
                222,
                223,
                224,
                225,
                226,
                227,
                228,
                229,
                230,
                231,
                232,
                233,
                234,
                235,
                236,
                237,
                238,
                239,
                240,
                241,
                242,
                243,
                244,
                245,
                246,
                247,
                248,
                249,
                250,
                251,
                252,
                253,
                254,
                255,
                256,
                257,
                258,
                259,
                260,
                261,
                262,
                263,
                264,
                265,
                266,
                267,
                268,
                269,
                270,
                271,
                272,
                273,
                274,
                275,
                276,
                277,
                278,
                279,
                280,
                281,
                282,
                283,
                284,
                285,
                286,
                287,
                288,
                289,
                290,
                291,
                292,
                293,
                294,
                295,
                296,
                297,
                298,
                299,
                300,
                301,
                302,
                303,
                304,
                305,
                306,
                307,
                308,
                309,
                310,
                311,
                312,
                313,
                314,
                315,
                316,
                317,
                318,
                319,
                320,
                321,
                322,
                323,
                324,
                325,
                326,
                327,
                328,
                329,
                330,
                331,
                332,
                333,
                334,
                335,
                336,
                337,
                338,
                339,
                340,
                341,
                342,
                343,
                344,
                345,
                346,
                347,
                348,
                349,
                350,
                351,
                352,
                353,
                354,
                355,
                356,
                357,
                358,
                359,
                360,
                361,
                362,
                363,
                364,
                365,
                366,
                367,
                368,
                369,
                370,
                371,
                372,
                373,
                374,
                375,
                376,
                377,
                378,
                379,
                380,
                381,
                382,
                383,
                384,
                385,
                386,
                387,
                388,
                389,
                390,
                391,
                392,
                393,
                394,
                395,
                396,
                397,
                398,
                399,
                400,
                401,
                402,
                403,
                404,
                405,
                406,
                407,
                408,
                409,
                410,
                411,
                412,
                413,
                414,
                415,
                416,
                417,
                418,
                419,
                420,
                421,
                422,
                423,
                424,
                425,
                426,
                427,
                428,
                429,
                430,
                431,
                432,
                433,
                434,
                435,
                436,
                437,
                438,
                439,
                440,
                441,
                442,
                443,
                444,
                445,
                446,
                447,
                448,
                449,
                450,
                451,
                452,
                453,
                454,
                455,
                456,
                457,
                458,
                459,
                460,
                461,
                462,
                463,
                464,
                465,
                466,
                467,
                468,
                469,
                470,
                471,
                472,
                473,
                474,
                475,
                476,
                477,
                478,
                479,
                480,
                481,
                482,
                483,
                484,
                485,
                486,
                487,
                488,
                489,
                490,
                491,
                492,
                493,
                494,
                495,
                496,
                497,
                498,
                499,
                500,
                501,
                502,
                503,
                504,
                505,
                506,
                507,
                508,
                509,
                510,
                511,
                512,
                513,
                514,
                515,
                516,
                517,
                518,
                519,
                520,
                521,
                522,
                523,
                524,
                525,
                526,
                527,
                528,
                529,
                530,
                531,
                532,
                533,
                534,
                535,
                536,
                537,
                538,
                539,
                540,
                541,
                542,
                543,
                544,
                545,
                546,
                547,
                548,
                549,
                550,
                551,
                552,
                553,
                554,
                555,
                556,
                557,
                558,
                559,
                560,
                561,
                562,
                563,
                564,
                565,
                566,
                567,
                568,
                569,
                570,
                571,
                572,
                573,
                574,
                575,
                576,
                577,
                578,
                579,
                580,
                581,
                582,
                583,
                584,
                585,
                586,
                587,
                588,
                589,
                590,
                591,
                592,
                593,
                594,
                595,
                596,
                597,
                598,
                599,
                600,
                601,
                602,
                603,
                604,
                605,
                606,
                607,
                608,
                609,
                610,
                611,
                612,
                613,
                614,
                615,
                616,
                617,
                618,
                619,
                620,
                621,
                622,
                623,
                624,
                625,
                626,
                627,
                628,
                629,
                630,
                631,
                632,
                633,
                634,
                635,
                636,
                637,
                638,
                639,
                640,
                641,
                642,
                643,
                644,
                645,
                646,
                647,
                648,
                649,
                650,
                651,
                652,
                653,
                654,
                655,
                656,
                657,
                658,
                659,
                660,
                661,
                662,
                663,
                664,
                665,
                666,
                667,
                668,
                669,
                670,
                671,
                672,
                673,
                674,
                675,
                676,
                677,
                678,
                679,
                680,
                681,
                682,
                683,
                684,
                685,
                686,
                687,
                688,
                689,
                690,
                691,
                692,
                693,
                694,
                695,
                696,
                697,
                698,
                699,
                700,
                701,
                702,
                703,
                704,
                705,
                706,
                707,
                708,
                709,
                710,
                711,
                712,
                713,
                714,
                715,
                716,
                717,
                718,
                719,
                720,
                721,
                722,
                723,
                724,
                725,
                726,
                727,
                728,
                729,
                730,
                731,
                732,
                733,
                734,
                735,
                736,
                737,
                738,
                739,
                740,
                741,
                742,
                743,
                744,
                745,
                746,
                747,
                748,
                749,
                750,
                751,
                752,
                753,
                754,
                755,
                756,
                757,
                758,
                759,
                760,
                761,
                762,
                763,
                764,
                765,
                766,
                767,
                768,
                769,
                770,
                771,
                772,
                773,
                774,
                775,
                776,
                777,
                778,
                779,
                780,
                781,
                782,
                783,
                784,
                785,
                786,
                787,
                788,
                789,
                790,
                791,
                792,
                793,
                794,
                795,
                796,
                797,
                798,
                799,
                800,
                801,
                802,
                803,
                804,
                805,
                806,
                807,
                808,
                809,
                810,
                811,
                812,
                813,
                814,
                815,
                816,
                817,
                818,
                819,
                820,
                821,
                822,
                823,
                824,
                825,
                826,
                827,
                828,
                829,
                830,
                831,
                832,
                833,
                834,
                835,
                836,
                837,
                838,
                839,
                840,
                841,
                842,
                843,
                844,
                845,
                846,
                847,
                848,
                849,
                850,
                851
            ],
            "coltypes": [
                1,
                1,
                1,
                1,
                1,
                1,
                0
            ],
            "data": [
                {
                    "sinsid": "64a14f61-8090-4eee-b371-8a7e89c7fa16",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "OSMANCA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 929.6776639344262
                },
                {
                    "sinsid": "a58ac8fc-5b4e-45af-8aac-1840ce2efa0a",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "GEBZE-DG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 949.4449999999999
                },
                {
                    "sinsid": "ff50afeb-aed7-4688-b07f-1d0414087907",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "ADA-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 813.8349035369775
                },
                {
                    "sinsid": "f74f5067-e2eb-4de6-85df-61723d02980f",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "AGACOR.K",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 820.7141020408163
                },
                {
                    "sinsid": "8eb54664-7d2d-4ede-a7e4-515e8ed3b231",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "AGACOR.G",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 811.3766734693877
                },
                {
                    "sinsid": "88d98ab0-c7c6-482a-85bf-f51801ac9d8b",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "ADAPAZAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 727.7411696306432
                },
                {
                    "sinsid": "ccefb2ce-6102-4ed1-8dc8-ab24d85d7f8d",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "YUNUSEMR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 708.9471108089733
                },
                {
                    "sinsid": "312b6d76-8e96-44e9-98e9-986a3b495d62",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "G.KAYA-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 530.6004548540394
                },
                {
                    "sinsid": "8e01efb1-3a41-4842-bddd-c1cbede5a301",
                    "b1Name": "URGUPTM",
                    "b2Name": "400",
                    "b3Name": "SINCAN1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 635.5768417462484
                },
                {
                    "sinsid": "575d5d0b-59cf-4994-bbd6-c3a56714d4e7",
                    "b1Name": "URGUPTM",
                    "b2Name": "400",
                    "b3Name": "SINCAN2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 619.7566712141883
                },
                {
                    "sinsid": "b50407e1-bc2d-4fb8-8535-f297415bbd7e",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 538.44576478586
                },
                {
                    "sinsid": "0f35280e-b0a5-47ad-a6c9-cfe1d8866d93",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 324.3512984364378
                },
                {
                    "sinsid": "ee95eda4-a026-4646-aa87-f05ef33d1dfd",
                    "b1Name": "GOKCEKAY",
                    "b2Name": "380",
                    "b3Name": "AKSAGOYN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 604.1415186440678
                },
                {
                    "sinsid": "5fd1911e-5ef8-49fa-9076-5bdfa194241e",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "SINCAN-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 554.6617267165193
                },
                {
                    "sinsid": "01996321-dd3b-4855-93d8-e8ac5765dd1c",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "ANKARA-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 244.2390006798096
                },
                {
                    "sinsid": "a9fe2bbb-d341-4f5a-9915-c081f4a95735",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "GOLBAS-G",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 552.7244057971013
                },
                {
                    "sinsid": "27190e4e-79a2-4526-9121-88a9b40c424b",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "GOLBAS-K",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 533.9498843537416
                },
                {
                    "sinsid": "d28a4615-c063-4c24-86af-86fedcf494e6",
                    "b1Name": "BOZOKTM",
                    "b2Name": "380",
                    "b3Name": "ICANADOL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 349.7779098360655
                },
                {
                    "sinsid": "d2813ebf-f6b0-424d-98d2-50c926aff5be",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "K.PINARG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 234.18896800000007
                },
                {
                    "sinsid": "8d432216-f1fe-4ea0-8701-565ae6df6d0f",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 276.33756887052346
                },
                {
                    "sinsid": "1b548d3c-3614-4ed0-b92d-bce43f1db5b4",
                    "b1Name": "KARATAY",
                    "b2Name": "380",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 218.62394380853277
                },
                {
                    "sinsid": "8a7f5dbf-ae05-4ed3-8c40-fe8526dc472e",
                    "b1Name": "KONYAKZY",
                    "b2Name": "380",
                    "b3Name": "AFYON-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 189.71763104152487
                },
                {
                    "sinsid": "147d5ba7-5e37-4b26-bb7b-58e2cc05fc94",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "AFYON-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.077000681663254
                },
                {
                    "sinsid": "2ee7de58-a1a4-4c21-8e5b-6046ebe89bcc",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "IGAGES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.166487406398915
                },
                {
                    "sinsid": "2b5cba2f-d35a-4499-82f7-d216f9d6bd0c",
                    "b1Name": "POLATCMT",
                    "b2Name": "154",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -5.8321414004078855
                },
                {
                    "sinsid": "fd027666-1f39-4780-bc1f-486aad687a27",
                    "b1Name": "GOKCEKAY",
                    "b2Name": "380",
                    "b3Name": "ESKISEH3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.39599322033898
                },
                {
                    "sinsid": "809e5f03-d036-4c57-8743-af8e3fb4bcf5",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "KAYAS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 188.54494994438267
                },
                {
                    "sinsid": "ed1a1ec7-82a1-4301-b68c-54f0a26e14f3",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -8.414737559645545
                },
                {
                    "sinsid": "32f0ead6-3ffc-423e-8b8a-7d2774429f38",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "KAYAS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 186.08628445424475
                },
                {
                    "sinsid": "6d272e1f-3b34-49c7-961c-d2a18eff136f",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "GOLBASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 137.78783618581906
                },
                {
                    "sinsid": "c8056eea-7049-410c-b0db-f0fb29a0a009",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "K.KALEDG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:17:00.000Z",
                    "AVG(maxValue)": 207.98315521628496
                },
                {
                    "sinsid": "322757c5-3c88-439f-b38a-9db32c9fa424",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:12:00.000Z",
                    "AVG(maxValue)": 105.12347600518807
                },
                {
                    "sinsid": "d6f7529b-302c-4830-a4d7-c3895e7c1ffa",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 140.59316793893132
                },
                {
                    "sinsid": "27e9d325-82e2-46ae-aba3-b52548b72e7f",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "TALAS1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 203.21785027472527
                },
                {
                    "sinsid": "876fc63c-9b45-4c1b-8524-7605ec665d98",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "TALAS2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 202.62459403192227
                },
                {
                    "sinsid": "231a71c5-f49d-4aba-8e26-9fff5925b0ea",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 48.48129563350035
                },
                {
                    "sinsid": "0349eefe-8c90-4498-b414-95060487205b",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 200.0
                },
                {
                    "sinsid": "4571aaba-b5e8-4aa8-9ad7-280e7129009d",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "KAYAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 74.80940896739129
                },
                {
                    "sinsid": "ba3a1273-51fd-4fc7-bb41-c7f65a84ea5f",
                    "b1Name": "CUMRA",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 100.27131381892444
                },
                {
                    "sinsid": "e7eebe87-d7b9-4b2e-9a22-3b93c5fe3b29",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "DIANAGES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 91.76071380013597
                },
                {
                    "sinsid": "c55ae78a-143d-44b0-a70a-dbed31a5f91f",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "MALTEPE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 119.85127236580516
                },
                {
                    "sinsid": "2369eb5a-5c0e-486f-88af-51d2ebdcad23",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 119.14572327044024
                },
                {
                    "sinsid": "e654cf77-35bb-4023-9f83-db65e354ba69",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 119.5389164785553
                },
                {
                    "sinsid": "f866e230-93ae-41fa-87da-3a79d088fb32",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "CUMRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 89.11862040133781
                },
                {
                    "sinsid": "c737a9c7-5796-4cc1-b489-a3b6da3cb62c",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 108.46779400461182
                },
                {
                    "sinsid": "8bec6004-5b38-4166-8cea-931799c9e0a1",
                    "b1Name": "ALAKOVA",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 153.84966689326993
                },
                {
                    "sinsid": "617ccbc2-a758-406b-8235-40fee54b5dbf",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 104.0095701540957
                },
                {
                    "sinsid": "1064bcf0-b81d-4945-adee-2e4f81560d5c",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 100.88354694485844
                },
                {
                    "sinsid": "212c54d2-3f7d-401d-b5a0-6ad9aa08977d",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": 108.56103448275861
                },
                {
                    "sinsid": "539d7f26-673c-4250-bd64-1aaa6dc5bf82",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 59.62302040816327
                },
                {
                    "sinsid": "353deb9a-be6c-4437-9c17-1555cab193ea",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "NALLIHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 120.88927166788058
                },
                {
                    "sinsid": "febcd272-662f-4636-ac8e-b85e3627a279",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "MAMAK4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 94.39882812500001
                },
                {
                    "sinsid": "aca9ccbc-b1dc-4ba4-9eb0-b9704e9a0320",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "AKKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 94.08947775628626
                },
                {
                    "sinsid": "b8821e4a-6ab3-4616-a906-f31b64a960fe",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 61.519
                },
                {
                    "sinsid": "6ea834b2-3814-43d8-ad37-ebd3481a65bc",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 91.73259536784742
                },
                {
                    "sinsid": "30c63a39-0580-4197-9d53-1c826d5d71ac",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "OKSUT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 56.422628726287265
                },
                {
                    "sinsid": "6f8cded7-5c7f-42f6-a067-0a0c4f220a26",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 93.47485943775101
                },
                {
                    "sinsid": "132f4e92-c9eb-40ff-ba8a-1e07734f5b69",
                    "b1Name": "OKSUTTM",
                    "b2Name": "154",
                    "b3Name": "SENDREME",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 60.32050487156775
                },
                {
                    "sinsid": "6e6caf40-b16a-440a-950e-1ffaea1e19c2",
                    "b1Name": "IMRAHOR",
                    "b2Name": "154",
                    "b3Name": "YILDIZ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 93.22440654843109
                },
                {
                    "sinsid": "7e4acbba-fd64-4158-9c5e-eb8174e55b86",
                    "b1Name": "IMRAH101",
                    "b2Name": "154",
                    "b3Name": "YILDIZ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 93.22781036834925
                },
                {
                    "sinsid": "06bca4c1-01ce-4925-9014-85c44e7e713d",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 93.06276119402986
                },
                {
                    "sinsid": "1353d19a-b0b5-45a1-8741-7d03cc8bc984",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "BAGLUM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -226.65153209109727
                },
                {
                    "sinsid": "de538b99-bb59-4df3-abe5-85d296cadc4e",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "TEKSINGE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 57.531983527796854
                },
                {
                    "sinsid": "feb2268a-b3f1-4a2d-ae7a-671f238a62b5",
                    "b1Name": "TEKSINGE",
                    "b2Name": "154",
                    "b3Name": "KARAMANO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 58.708602590320375
                },
                {
                    "sinsid": "8fb405a1-5b54-4745-a37e-6df1248e5417",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "MACUNKO2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 72.89766666666667
                },
                {
                    "sinsid": "3f6e7439-477d-4421-aee1-bc3472239c9e",
                    "b1Name": "HADIM",
                    "b2Name": "154",
                    "b3Name": "GUNEYSIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 62.29775401069518
                },
                {
                    "sinsid": "03bf0499-0261-4a1e-b9db-15315cc1233f",
                    "b1Name": "KARMNBES",
                    "b2Name": "154",
                    "b3Name": "AYRANCI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:42:00.000Z",
                    "AVG(maxValue)": 66.43049450549451
                },
                {
                    "sinsid": "7166be3f-059c-4162-b684-339d9d121809",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "AKSRYOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 68.94253233492172
                },
                {
                    "sinsid": "ecd7615e-572c-447c-ab19-09f35efe72f2",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 64.46614130434783
                },
                {
                    "sinsid": "ff2e4fa3-7c67-44e0-92df-a1892fae6718",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "ERYAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 71.37234534330386
                },
                {
                    "sinsid": "b8e26615-e99c-4755-8c61-a5f88ac8b0a1",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "KARAPINA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 46.957814840027226
                },
                {
                    "sinsid": "d51a6a2e-e5bb-41f1-8ad9-45c86fd9dae6",
                    "b1Name": "GUNEYSNR",
                    "b2Name": "154",
                    "b3Name": "CUMRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 56.221535836177466
                },
                {
                    "sinsid": "e33588f7-d29c-4af5-9051-c9021c8b1fb4",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 43.96211343686698
                },
                {
                    "sinsid": "da25ae1b-f343-4182-9178-0a63a004d08d",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "UMITKOY2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 56.19769230769231
                },
                {
                    "sinsid": "9fedaf64-92fa-462d-ab61-633a073eed53",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.366232616940586
                },
                {
                    "sinsid": "668d2547-88d8-4283-a4eb-c34cad4109ca",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 37.03214480874317
                },
                {
                    "sinsid": "af155940-1196-42d7-bf54-13874fc22d8d",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "HASKOY-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 74.78725274725277
                },
                {
                    "sinsid": "dbd700a7-3ea7-4b44-a0ea-19cd94bea97f",
                    "b1Name": "SIZIR",
                    "b2Name": "154",
                    "b3Name": "KAYSRKAP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 62.93717006802722
                },
                {
                    "sinsid": "f4e5852d-f279-4a40-8e7c-645613465f1c",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 82.23755282890252
                },
                {
                    "sinsid": "4cf3d059-c3d0-4503-980c-b5888cc82cd6",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 61.97782993197279
                },
                {
                    "sinsid": "e8f68226-3b4a-4ecb-96d2-98d631ace25a",
                    "b1Name": "KARGIHS",
                    "b2Name": "154",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": 60.188043052837564
                },
                {
                    "sinsid": "06ce0587-81ec-440d-81ec-09a55c95550d",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "CAMLICA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.50618233618234
                },
                {
                    "sinsid": "f49e376b-05e6-4370-8fae-9acac97dffa0",
                    "b1Name": "KEPEZKAY",
                    "b2Name": "154",
                    "b3Name": "HADIM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 53.756897959183675
                },
                {
                    "sinsid": "6f2d5870-4c91-40c9-b0a1-0b01e4ac4720",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 44.4152610441767
                },
                {
                    "sinsid": "4c9c2e4a-fca1-43a2-a715-cb0052d3a1b3",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "NIGDE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 66.4807970027248
                },
                {
                    "sinsid": "a2f87c82-7d4a-45ca-b8ba-26b77918d0d6",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "SELCUKLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 69.25147159479808
                },
                {
                    "sinsid": "39eeadf3-8671-4e13-99af-04870e571527",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "BEYPAZAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 71.19368998628258
                },
                {
                    "sinsid": "4e43b115-fa25-4414-924f-1f24528df3a5",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "OYAK1GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 67.80165193745749
                },
                {
                    "sinsid": "617042b4-6d61-41ae-953d-a11f3300884a",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "INCEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.52987738419618
                },
                {
                    "sinsid": "f6d0b17a-d385-4da1-a256-27a7c623d07e",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "MUDURNU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 44.27311019567456
                },
                {
                    "sinsid": "88862231-80ea-44d6-8680-5b29f44e40d0",
                    "b1Name": "MALTEPE",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 52.407551159618
                },
                {
                    "sinsid": "6864f3b3-6ebb-4ad9-a270-d41cdb3da430",
                    "b1Name": "YOZGAT",
                    "b2Name": "154",
                    "b3Name": "YIBITAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 46.15544897959183
                },
                {
                    "sinsid": "16418829-235c-40e1-9d55-8b44be7ca3e3",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 43.100357624831304
                },
                {
                    "sinsid": "ddcd0f8c-c0df-48cb-b925-7c9366aee45b",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -308.30576766304347
                },
                {
                    "sinsid": "4fb4bea3-a74f-4b04-99b5-ff2e37718e44",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "ALAKOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 59.275252525252526
                },
                {
                    "sinsid": "2cac7a90-c600-419a-a8b5-f73bb08f607a",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "ERCIYESR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 43.085443223443214
                },
                {
                    "sinsid": "3a561722-4f4a-4a89-a2ce-aa7c8174dcdb",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 60.616265151515165
                },
                {
                    "sinsid": "f3221cc4-678c-47b1-ab39-f13ed30c4ac2",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 68.61936356404138
                },
                {
                    "sinsid": "2ce004bc-298b-4d77-a278-6679a0ea802d",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "POLATLI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.158794277929156
                },
                {
                    "sinsid": "a21a2051-69ca-4246-a4e6-083d9761024b",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "UMITKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 59.36993197278911
                },
                {
                    "sinsid": "9d004b57-f621-4d7d-8150-0dff7232bbde",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 40.511842105263156
                },
                {
                    "sinsid": "e724dccc-a347-4fc1-9c54-c3726723f3d2",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "PETLAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 54.20856621004566
                },
                {
                    "sinsid": "f822aa2c-0411-4aac-96d2-247a1ea66d3b",
                    "b1Name": "ADATOPRK",
                    "b2Name": "154",
                    "b3Name": "DDYKOCAH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.64431454418928
                },
                {
                    "sinsid": "7a1f0119-a773-435c-8d56-5fa5d62425d3",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "MACUNKO1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 61.6647619047619
                },
                {
                    "sinsid": "f97e39f5-275e-4f43-bdea-2fc3d220e4f8",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "YAZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 62.713262942779295
                },
                {
                    "sinsid": "2e362cff-5fa5-437a-ab88-b6b87dc3e1a1",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "KAYSER21",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 62.41040163376447
                },
                {
                    "sinsid": "5422ddfc-8508-4712-877a-bac309aa76b1",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 66.39154870940881
                },
                {
                    "sinsid": "eb533391-8909-4ea3-a45f-99aa035f3afb",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "ALC-UMIT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.289597544338335
                },
                {
                    "sinsid": "8ad1f19b-1a79-422e-87ee-1dbcf0f56d64",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "KAYSER23",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 60.998483606557365
                },
                {
                    "sinsid": "fa01bb1a-2f9b-4d35-8ca8-136319988959",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "DERINKUY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 53.44096180081855
                },
                {
                    "sinsid": "febc2bc3-6156-444b-a47a-7743788a6249",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "AKSURES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.440891763104155
                },
                {
                    "sinsid": "dca9b462-541a-4d8d-87ae-de3c6c10335a",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:56:00.000Z",
                    "AVG(maxValue)": 26.647418300653595
                },
                {
                    "sinsid": "61463eba-0639-483f-9c80-15f52d65d6c1",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 70.92567255434783
                },
                {
                    "sinsid": "4052b2c9-c24d-4f2d-95e3-47358c5f9e8a",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:30:00.000Z",
                    "AVG(maxValue)": 14.010405844155844
                },
                {
                    "sinsid": "c1ca444c-6610-4b7c-9a82-d8977580c408",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "KAYSER22",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 59.73426520847574
                },
                {
                    "sinsid": "d238d0a8-1183-4170-904d-fd0da5b1b4e7",
                    "b1Name": "KARAMANO",
                    "b2Name": "154",
                    "b3Name": "KARAMANB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 36.909018404907975
                },
                {
                    "sinsid": "d861c028-13c2-4c33-8c79-1d1fb2b061f3",
                    "b1Name": "KULU",
                    "b2Name": "154",
                    "b3Name": "EMIRLER",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 58.05810534016093
                },
                {
                    "sinsid": "95329efd-d60c-424b-8dd1-d9fc024cb3b0",
                    "b1Name": "YAMULAHS",
                    "b2Name": "154",
                    "b3Name": "CINKUR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:27:00.000Z",
                    "AVG(maxValue)": 74.72311224489796
                },
                {
                    "sinsid": "a92a6a91-4f2c-4814-8711-8a3fabac19a1",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "KULU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 41.80298772169168
                },
                {
                    "sinsid": "74fc66eb-5e37-475b-8f84-089ab7dd4d6a",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "CEKEREKH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -33.650974440894565
                },
                {
                    "sinsid": "76392279-6b71-473e-a730-3fd497983239",
                    "b1Name": "KARATAY",
                    "b2Name": "380",
                    "b3Name": "SEYDISEH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 0.3300094161958555
                },
                {
                    "sinsid": "c1ee2b28-f8e5-4b90-a31c-69eb1c884f86",
                    "b1Name": "HACILAR",
                    "b2Name": "154",
                    "b3Name": "KIRIKKLA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 38.098582866293036
                },
                {
                    "sinsid": "91d91e04-21fa-4cb8-8425-ef4fd48bdda3",
                    "b1Name": "KIRSEHIR",
                    "b2Name": "154",
                    "b3Name": "KIZILRMK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 49.01912828947368
                },
                {
                    "sinsid": "c42668ac-b558-4b62-9882-25e9913f7cc9",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 64.0069775357386
                },
                {
                    "sinsid": "1584cc8c-8360-4cde-8eeb-ebe775f492f3",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "DDYPINAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 32.53455993930197
                },
                {
                    "sinsid": "134bf7ce-db28-44d9-95f1-c7d03e362207",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.420081632653061
                },
                {
                    "sinsid": "bc9938b7-9dec-4477-84de-57848357784a",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "BOLU-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": 54.79605084745763
                },
                {
                    "sinsid": "26332173-a2c2-4ff8-b6b1-ff746501d985",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "BAGLAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 60.94878911564625
                },
                {
                    "sinsid": "3a8b70c0-ecdb-47b5-941d-b28d9d11c3b3",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "BAGLICAG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 54.16987780040734
                },
                {
                    "sinsid": "a236fe41-e795-4724-957d-6c802e01d3e4",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "HACILAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 47.354672413793104
                },
                {
                    "sinsid": "eb6bd1d4-9067-495e-b222-1f315dadd852",
                    "b1Name": "SENDIRMK",
                    "b2Name": "154",
                    "b3Name": "TAKSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 31.417688647178792
                },
                {
                    "sinsid": "0fe20931-9c9f-4471-88be-cc99f43113bc",
                    "b1Name": "POLATLI",
                    "b2Name": "154",
                    "b3Name": "BEYKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 8.847191547375594
                },
                {
                    "sinsid": "b8619d29-14e4-41f9-8ead-7ba0a545b215",
                    "b1Name": "BOR",
                    "b2Name": "154",
                    "b3Name": "NIGDEOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 28.232450646698435
                },
                {
                    "sinsid": "b7e8316e-5120-4fec-bf5e-99fe670524df",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "BASTAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 43.80774665042632
                },
                {
                    "sinsid": "1df77157-6f24-4ab4-8cfc-a9a6a2efdec4",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "BASTAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 43.77858500527983
                },
                {
                    "sinsid": "029b6a89-324f-4248-8c99-79dbe085ee1c",
                    "b1Name": "POLATLI",
                    "b2Name": "154",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.431475295755047
                },
                {
                    "sinsid": "61ff387f-0679-441d-8518-2194150654f5",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "MAMAK3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:45:00.000Z",
                    "AVG(maxValue)": 59.00765363128493
                },
                {
                    "sinsid": "3f280f1a-da7c-4482-a77e-ed62ebd842e7",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "MAMAK3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:45:00.000Z",
                    "AVG(maxValue)": 59.33651724137931
                },
                {
                    "sinsid": "e7efe6fe-ded5-4cc5-b269-49c8c3a3a89c",
                    "b1Name": "BOR",
                    "b2Name": "154",
                    "b3Name": "BOROSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 41.56136734693877
                },
                {
                    "sinsid": "4bdf1924-361d-4626-9611-ca4305d49cce",
                    "b1Name": "YIBITAS",
                    "b2Name": "154",
                    "b3Name": "YERKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.05903343023255
                },
                {
                    "sinsid": "b96ce559-91b1-4b8a-ad5c-8ea7f741d758",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 49.882455871066774
                },
                {
                    "sinsid": "8742a840-5e81-4cde-a96f-909dfc3f0b41",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "ERKILET",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 53.361519073569475
                },
                {
                    "sinsid": "d275aa0f-4c7b-44de-a411-4acd269777a3",
                    "b1Name": "PETLAS",
                    "b2Name": "154",
                    "b3Name": "KIRSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 49.43110456553756
                },
                {
                    "sinsid": "bd5ee613-4d64-4f31-b5b4-1e62dfddbaa0",
                    "b1Name": "BEYPAZAR",
                    "b2Name": "154",
                    "b3Name": "ETI-SODA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 48.90122529644269
                },
                {
                    "sinsid": "20675deb-e5f5-4832-8eb9-9966c4afd5f7",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "SORGUN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:29:00.000Z",
                    "AVG(maxValue)": 39.8222418879056
                },
                {
                    "sinsid": "a9df9911-8328-4af7-9e55-9e8f46c6ff36",
                    "b1Name": "SIVRIHIS",
                    "b2Name": "154",
                    "b3Name": "BEYLIKKO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.602835195530725
                },
                {
                    "sinsid": "a7bad02e-e419-4ad5-a0bd-50215b534ff0",
                    "b1Name": "R3KRMN1R",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 49.54418541240628
                },
                {
                    "sinsid": "e5bfc197-e393-4335-8fe3-43d34a2bbf4c",
                    "b1Name": "BOROSB",
                    "b2Name": "154",
                    "b3Name": "TUMOSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 48.23872354948805
                },
                {
                    "sinsid": "fd212a25-759b-4219-83ed-2a2b322ee9d9",
                    "b1Name": "CUMRA",
                    "b2Name": "154",
                    "b3Name": "ABHOYUGU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.595204359673026
                },
                {
                    "sinsid": "2f4c6d7b-3644-4eff-8f84-0b327a4a41c5",
                    "b1Name": "R3KRMN1R",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 51.64096385542168
                },
                {
                    "sinsid": "5e99fd4a-02f0-47ea-b12a-e307237e39a5",
                    "b1Name": "R3KRMN1R",
                    "b2Name": "154",
                    "b3Name": "KEPEZKAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 51.19023232323232
                },
                {
                    "sinsid": "ad33e263-6009-47ae-b850-20ae108be5e7",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "BUSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 45.426422893481714
                },
                {
                    "sinsid": "ca20dc9f-4ca7-42d5-9b42-8166cae87695",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "YOZGAT-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.945548738922966
                },
                {
                    "sinsid": "f632da58-aebb-4121-835a-ff8e68a161a2",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "ALTINEKI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.35274897680763
                },
                {
                    "sinsid": "6d78ef3c-58bb-4cca-8c6a-ba05e7c628bb",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "MAV-BIO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 32.23378048780488
                },
                {
                    "sinsid": "5c6d486d-df37-4b97-acb6-9668ef7fdec2",
                    "b1Name": "MAMAK",
                    "b2Name": "154",
                    "b3Name": "HASKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.933489795918376
                },
                {
                    "sinsid": "e2c60b5c-f9f7-4222-ad01-31a2d7dc2f8d",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 23.68450681635926
                },
                {
                    "sinsid": "ddf907dd-ce4b-4017-97aa-ba994b36b8b3",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 5.176337644656228
                },
                {
                    "sinsid": "eb21484c-8c8a-473a-84ea-30541a788801",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "BILKENT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 38.88106730115568
                },
                {
                    "sinsid": "4d1c3d6a-5836-47b7-a3f5-57f399a0835d",
                    "b1Name": "SELCUKLU",
                    "b2Name": "154",
                    "b3Name": "ERENKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 45.56572108843538
                },
                {
                    "sinsid": "d722805a-06ce-434c-acbf-9dcbce28da3e",
                    "b1Name": "ALTINEKN",
                    "b2Name": "154",
                    "b3Name": "CIHANBEY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.79193328795099
                },
                {
                    "sinsid": "cc5db0d4-389c-4372-90c1-4eb49b844fff",
                    "b1Name": "NIGDE",
                    "b2Name": "154",
                    "b3Name": "NIGDEOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 19.571774303195106
                },
                {
                    "sinsid": "a5174acc-ba04-4a53-a518-e5ee57b4befe",
                    "b1Name": "BEYLIKKO",
                    "b2Name": "154",
                    "b3Name": "POLATLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:44:00.000Z",
                    "AVG(maxValue)": -7.584328358208955
                },
                {
                    "sinsid": "ed4081b7-128b-49d5-b693-10329488a1ca",
                    "b1Name": "A.HOYUGU",
                    "b2Name": "154",
                    "b3Name": "SEYDISEH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 33.17927116827438
                },
                {
                    "sinsid": "afa5f45e-3a56-4b8d-9a1f-dafac1305e7c",
                    "b1Name": "KEPEZKAY",
                    "b2Name": "154",
                    "b3Name": "KARAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 23.911914168937322
                },
                {
                    "sinsid": "3fcc25d3-69ff-441e-a228-9996947b8ebd",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 19.820568383658973
                },
                {
                    "sinsid": "c6d8aa5c-53c2-4b20-9d41-99f525f452ae",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.28515358361775
                },
                {
                    "sinsid": "affaac70-d139-465f-a7db-dca288d04560",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "DDYGOZLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 41.79458563535912
                },
                {
                    "sinsid": "ffd77e77-df1c-4890-af56-5b7d3b960bdd",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "NEVSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 15.628070175438594
                },
                {
                    "sinsid": "c97293d8-f17e-4288-b7eb-2d319f7894cb",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 13.22912013536379
                },
                {
                    "sinsid": "ff4e9e9b-5fcb-4676-9b53-6a91b9104276",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "KALABA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 22.283712534059944
                },
                {
                    "sinsid": "a920e80a-585a-4891-b005-06bbf9cdf2e8",
                    "b1Name": "BALGAT",
                    "b2Name": "154",
                    "b3Name": "CIGDEMGI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.172985685071573
                },
                {
                    "sinsid": "39897118-7f73-4ab4-a0bb-df6e3456d487",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 26.59270998415214
                },
                {
                    "sinsid": "beba1faa-d52b-48ef-82ce-b394e23b63cb",
                    "b1Name": "YERKOY",
                    "b2Name": "154",
                    "b3Name": "KIRSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 26.358047223994898
                },
                {
                    "sinsid": "299cb9a0-42f2-4171-98f6-bbc74717d900",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "SORGUN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.32589918256131
                },
                {
                    "sinsid": "b63bb96c-1287-4d13-900e-5f9add433d3b",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "NEVSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 12.236148097826087
                },
                {
                    "sinsid": "0227909b-6f69-465c-9d9e-8826efda9235",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 30.773272108843543
                },
                {
                    "sinsid": "29bce1d6-8b0c-4f03-b261-3c070f335776",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "KAYSER-4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.528142857142846
                },
                {
                    "sinsid": "afa4c823-2cec-47d0-beb7-d828b2241ca8",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "KARAMANO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 10.596057298772168
                },
                {
                    "sinsid": "68111e02-ae43-4b3b-bf01-9dfe3bb206d6",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "KAYSERI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 32.82460544217687
                },
                {
                    "sinsid": "a56b9352-37de-4e52-a471-30d008665b72",
                    "b1Name": "ERYAMAN",
                    "b2Name": "154",
                    "b3Name": "ANKARASA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.430951086956522
                },
                {
                    "sinsid": "9318f8f6-bd0f-4a49-8117-eefd1f8a0ea4",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 41.77423809523809
                },
                {
                    "sinsid": "103ecac0-8e13-4874-b642-509f2538bc4a",
                    "b1Name": "SARKISLA",
                    "b2Name": "154",
                    "b3Name": "SIZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 44.66446185286103
                },
                {
                    "sinsid": "2010557e-bfd7-4678-91be-b6f43d00b9da",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "ANK-SAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.34462950373894
                },
                {
                    "sinsid": "4c8914a2-d2ec-4bc5-a3c6-321c92e2d6bb",
                    "b1Name": "AKSRYOSB",
                    "b2Name": "154",
                    "b3Name": "TUMOSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.67399727148704
                },
                {
                    "sinsid": "53a3afa4-b470-49fb-a7e6-8cff1b52da86",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "G4BOR-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 21.529167832167833
                },
                {
                    "sinsid": "36c19f1c-c4dd-4f65-a346-2fe37390437e",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "KIZOREN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 27.504734883720925
                },
                {
                    "sinsid": "a2884cf9-1a7d-4f83-afe1-41a3fa3a37e4",
                    "b1Name": "ALTINOVA",
                    "b2Name": "154",
                    "b3Name": "DDYCAYIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 24.632074829931973
                },
                {
                    "sinsid": "4af747d0-7ff6-460d-a321-7fab765d1b65",
                    "b1Name": "POLATLI",
                    "b2Name": "154",
                    "b3Name": "POLATCMT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 7.950054570259213
                },
                {
                    "sinsid": "b8b2be55-ef3e-4d03-81cf-23f1c1c8b5ce",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAYSERI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 40.31730245231607
                },
                {
                    "sinsid": "a4214ab4-f563-4ca0-a641-f2aa0f543456",
                    "b1Name": "HASKOY",
                    "b2Name": "154",
                    "b3Name": "AKKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.022577319587626
                },
                {
                    "sinsid": "225a0248-b26a-4128-86e8-096d2a955fd5",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.489081632653054
                },
                {
                    "sinsid": "f03cd452-d53d-4d3c-bbe7-3f2dc2446920",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "AKKOPGI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.44091711956521
                },
                {
                    "sinsid": "bc46f783-3edb-4fbb-8713-03d71fda7e58",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "AKKOPGI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.33960409556313
                },
                {
                    "sinsid": "cd22d782-04c2-4cc0-b93f-dba5892553b1",
                    "b1Name": "IMRAHOR",
                    "b2Name": "154",
                    "b3Name": "CIGDEMGI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 26.865878746594007
                },
                {
                    "sinsid": "cf00b54d-9567-4757-8665-4333a1dc4592",
                    "b1Name": "IMRAH101",
                    "b2Name": "154",
                    "b3Name": "CIGDEMGI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 26.864611716621248
                },
                {
                    "sinsid": "ef50e09c-9ed5-4707-a267-3cd77ba60bed",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "BOR_OSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.2829648241206
                },
                {
                    "sinsid": "11136c38-18c0-4615-9cc1-28e2f422656e",
                    "b1Name": "KOLUKISA",
                    "b2Name": "154",
                    "b3Name": "ALTINOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 36.60957547169811
                },
                {
                    "sinsid": "c9d60dea-7d5c-464f-9547-e4b40894d8ee",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "DDYNENEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:43:00.000Z",
                    "AVG(maxValue)": 28.18505747126437
                },
                {
                    "sinsid": "48a35977-2969-4ee8-b9b1-5d88558d5650",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "DDYNENEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:43:00.000Z",
                    "AVG(maxValue)": 28.220065217391305
                },
                {
                    "sinsid": "f5908a54-7ee8-426f-bbd2-e249bb0e1dd0",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "POLATCMT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 10.37924965893588
                },
                {
                    "sinsid": "042dfc93-156e-4104-b564-2109c7a6eeb3",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "YAYSUNGE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 19.089431728492496
                },
                {
                    "sinsid": "7bfa0cfe-fb18-41eb-8b08-646b8aca1525",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 14.740348953140577
                },
                {
                    "sinsid": "6cb65809-c585-4fb4-bcf5-0f5a90f82297",
                    "b1Name": "CEKERKHV",
                    "b2Name": "154",
                    "b3Name": "SORGUN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 35.12535423925667
                },
                {
                    "sinsid": "902e267d-5137-4b33-bb3f-387f2cb17971",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 37.7176902173913
                },
                {
                    "sinsid": "b9adedf9-cdc5-4289-ab71-bbc0b9d72aab",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "KURSUNL1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -35.2075956284153
                },
                {
                    "sinsid": "188b89bc-fbf4-410f-a4e5-ce99f2b21392",
                    "b1Name": "KIZOREN",
                    "b2Name": "154",
                    "b3Name": "ESMEKAYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.992641252552758
                },
                {
                    "sinsid": "aa38c49c-9c1e-4d12-9c87-56b4e34c63dd",
                    "b1Name": "ALAKOVA",
                    "b2Name": "154",
                    "b3Name": "MERAMGIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 34.858089734874234
                },
                {
                    "sinsid": "3a95527b-285b-495c-abd0-dc996d398519",
                    "b1Name": "CIHANBEY",
                    "b2Name": "154",
                    "b3Name": "KULU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.693544648943416
                },
                {
                    "sinsid": "66361ce5-cdff-4208-9028-e0ed2a7e5fc0",
                    "b1Name": "YAYSUNGE",
                    "b2Name": "154",
                    "b3Name": "ATAHANGS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.00574048913043
                },
                {
                    "sinsid": "3483efaa-5e69-4077-b8d7-1102e15fec1e",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "BOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 7.5177849002849015
                },
                {
                    "sinsid": "582ec124-2e8d-4dcc-838d-6d4adcbb8139",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:47:00.000Z",
                    "AVG(maxValue)": 25.045700076511096
                },
                {
                    "sinsid": "7b4c69fd-6eb8-4d2c-a18d-10c5bec704dd",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 49.157777777777774
                },
                {
                    "sinsid": "a56df038-e55f-4a09-a8a3-90d706aac53d",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "ESENBOG2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.745426039536465
                },
                {
                    "sinsid": "843d7b1f-d22b-4b8b-909f-e64c28cffcd8",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "YAHYALI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 25.947487562189057
                },
                {
                    "sinsid": "e5e33773-19d7-434e-94b5-bb0bf72fd2a9",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "ESENBOG1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 31.07702316076295
                },
                {
                    "sinsid": "4df527b9-7a36-4c56-b03c-97009670b795",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "KURSUNL2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -19.900802395209578
                },
                {
                    "sinsid": "c5a1f9c4-7aca-4cc7-b356-daebd3ebf8e1",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 24.143714902807773
                },
                {
                    "sinsid": "54646057-fa3f-4172-ad21-10f41ea6d9b6",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 22.945418006430874
                },
                {
                    "sinsid": "00d34fb7-c866-40f6-b888-88be58e7faa6",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.788751084128357
                },
                {
                    "sinsid": "688ec87b-611a-48af-944e-fcecc71d21ce",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "KAZANTM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 38.845600303951365
                },
                {
                    "sinsid": "246f5b7b-5b5d-4f49-9c8a-e1862bba3db9",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "YOZGAT-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 24.665928961748634
                },
                {
                    "sinsid": "f339ea68-486d-4aed-941b-80e4a5c853a3",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 14.884966542750929
                },
                {
                    "sinsid": "e5d7fde2-6549-4305-b4ca-9eedac74ff8b",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "MISLIOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.410074982958413
                },
                {
                    "sinsid": "b3f6f8c2-6750-44d8-b288-8a14f1288108",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "KAYACIK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 18.315876288659794
                },
                {
                    "sinsid": "ea12c2cb-71f7-4f37-a693-e2c7bb8d02ca",
                    "b1Name": "KARAMANR",
                    "b2Name": "154",
                    "b3Name": "AKYEL-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:15:00.000Z",
                    "AVG(maxValue)": 20.466857142857144
                },
                {
                    "sinsid": "8be3623e-afbc-4576-a19e-e8cbafc99f76",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "OVACIK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 32.977429178470246
                },
                {
                    "sinsid": "98255ef8-64a2-400f-a712-7b1159a9fc95",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "KIRIKKAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.452262228260867
                },
                {
                    "sinsid": "c6475b3f-2e91-4a8d-a3ae-3b8df98a79a1",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "E.SEHIR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.680939947780677
                },
                {
                    "sinsid": "69cfd618-c6f5-4526-8ee8-149463d2d869",
                    "b1Name": "KARAMANR",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.140292517006802
                },
                {
                    "sinsid": "748067ec-f937-47a9-b6d6-b5d64af41dca",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "DERINKU1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.650442779291556
                },
                {
                    "sinsid": "cfa1a09f-6279-4470-ba66-496536509bce",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "OVACIK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 32.50617605633803
                },
                {
                    "sinsid": "9ade1822-a6d8-49ef-a25c-c723bc9231fd",
                    "b1Name": "POLATCMT",
                    "b2Name": "154",
                    "b3Name": "POLATLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -4.235702647657842
                },
                {
                    "sinsid": "50b59403-506c-42b0-b9e8-7c32febada40",
                    "b1Name": "KARALIKR",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 27.202045454545456
                },
                {
                    "sinsid": "ff12f1bb-7a6f-4937-be09-8f6732494c9c",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "KAYACIK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 17.53401176470588
                },
                {
                    "sinsid": "041bd45d-d0be-48de-8223-c5f617b4560f",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "CIMPOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 15.456924050632914
                },
                {
                    "sinsid": "173ae7f4-e4e2-4c9f-8126-d47906a014c2",
                    "b1Name": "KARALIKR",
                    "b2Name": "154",
                    "b3Name": "CEKRKHVZ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 17.558487140695917
                },
                {
                    "sinsid": "2ca5aae5-0d37-4088-b10e-a14eed4ed639",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "CIGDEM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.082834806254247
                },
                {
                    "sinsid": "cd8b5f03-a22b-4602-95db-927de02f5a86",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "HASKOY-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.667825494205866
                },
                {
                    "sinsid": "99688e3e-b3aa-4853-8884-957fd79eaabc",
                    "b1Name": "ALTINOVA",
                    "b2Name": "154",
                    "b3Name": "YUNAK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.552712440516656
                },
                {
                    "sinsid": "63932786-6733-47b8-8985-9ab9cdbad837",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "HOTAMIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.586716621253405
                },
                {
                    "sinsid": "f5689c95-e80d-4bfe-99c7-0b8d19441676",
                    "b1Name": "SENDIRMK",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.291960517358747
                },
                {
                    "sinsid": "f0ade9cd-ac49-457f-a998-298f803bb769",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "DERINKU2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.031761904761908
                },
                {
                    "sinsid": "809a2c78-fcb7-4044-a0a3-fa8b664222c3",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "CIMPOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 15.526859956236324
                },
                {
                    "sinsid": "2f228cc1-8bdd-424a-9025-4cdb95179bc5",
                    "b1Name": "NIGDEOSB",
                    "b2Name": "154",
                    "b3Name": "NIGDE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.145741496598639
                },
                {
                    "sinsid": "c948f4c5-c81f-47fc-bbc3-0f64f9862833",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "ESMEKAYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 9.607159400544958
                },
                {
                    "sinsid": "038e51b1-dfc6-4c99-9251-acee672802a6",
                    "b1Name": "PINARBAS",
                    "b2Name": "154",
                    "b3Name": "SARKISLA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.411756296800544
                },
                {
                    "sinsid": "79766c45-b38a-4397-a2bf-6261c5ab5623",
                    "b1Name": "SORGUN",
                    "b2Name": "154",
                    "b3Name": "BOZOK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.681769911504423
                },
                {
                    "sinsid": "a5298c09-a570-44d2-877b-f5d2865b7f8b",
                    "b1Name": "SARIYAR",
                    "b2Name": "154",
                    "b3Name": "NALLIHA2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.11671875
                },
                {
                    "sinsid": "dc4d2880-0b41-406d-b4ba-e137efb87451",
                    "b1Name": "HOTAMIS",
                    "b2Name": "154",
                    "b3Name": "BUSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 22.067880027266533
                },
                {
                    "sinsid": "e903e7a7-2791-47af-ab0b-38f1dfeff8cd",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.917683923705724
                },
                {
                    "sinsid": "4a1d4ef2-42ca-44d3-940c-d44f5be60db8",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.210251700680272
                },
                {
                    "sinsid": "82f0e103-3807-4d84-aa27-893fd8a9b638",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.210380952380952
                },
                {
                    "sinsid": "e406c8a9-007e-4e5a-8b92-66393968836c",
                    "b1Name": "KESIKKOP",
                    "b2Name": "154",
                    "b3Name": "KIZ-ATAK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.5405987261146494
                },
                {
                    "sinsid": "96ed450d-a88a-4e1e-9ad1-fdca024853e4",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "ORTAKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 22.38572888283379
                },
                {
                    "sinsid": "d6561edc-4303-4929-b0c3-c2ec8632112e",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "SANAYITM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 29.472135922330093
                },
                {
                    "sinsid": "19e3ee75-3e34-43cf-b8a3-d7994486b836",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 37.60177831912302
                },
                {
                    "sinsid": "75921b46-b829-4df8-86e4-7d5eae9f0034",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:36:00.000Z",
                    "AVG(maxValue)": 31.452972972972972
                },
                {
                    "sinsid": "89b4295e-1c24-407e-9acd-94db57a0a264",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "DAGYAKA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 21.317296099290775
                },
                {
                    "sinsid": "9101b59d-bfa0-4fcd-8f0f-a1069d4d7ce4",
                    "b1Name": "ORTAKOY",
                    "b2Name": "154",
                    "b3Name": "KUT-ATA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.999420586230404
                },
                {
                    "sinsid": "e68c876f-6649-46e1-8569-9f41d42c4589",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:02:00.000Z",
                    "AVG(maxValue)": 11.327302259887006
                },
                {
                    "sinsid": "cb9b2593-3118-4069-b9b9-be41eb68b907",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "SKOCHSAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": 17.320309597523217
                },
                {
                    "sinsid": "f033a614-7f28-43e9-89c4-ed234c5fd545",
                    "b1Name": "KESIKKOP",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 1.6899321113374064
                },
                {
                    "sinsid": "7b87a925-54a8-4212-ac46-a6a3b4a8205e",
                    "b1Name": "NEVSEHIR",
                    "b2Name": "154",
                    "b3Name": "DERINKUY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.180496598639458
                },
                {
                    "sinsid": "f6b5fe96-51d6-43be-946d-b03b1cf1c1d5",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "KESIKKOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:29:00.000Z",
                    "AVG(maxValue)": 14.854819819819822
                },
                {
                    "sinsid": "cb132bb2-32ad-4ddd-8d6f-3ecc34388805",
                    "b1Name": "BEYLIKKO",
                    "b2Name": "154",
                    "b3Name": "SIVRIHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:44:00.000Z",
                    "AVG(maxValue)": -12.228636363636362
                },
                {
                    "sinsid": "32d464a6-ed71-4877-abe5-811121c8ebfe",
                    "b1Name": "BEYPAZAR",
                    "b2Name": "154",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 11.178103448275863
                },
                {
                    "sinsid": "03cfb75f-a251-4c39-9324-33cefb96552f",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.676261925411969
                },
                {
                    "sinsid": "2ad457c3-1f54-418b-b11a-25431c8ba5f5",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "UZAYOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.251520706042093
                },
                {
                    "sinsid": "5342cc88-1a97-4c40-a286-7cf20f57e046",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "SINCANTM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 26.909853264856938
                },
                {
                    "sinsid": "a76b4a98-8f79-4298-9350-35f0a491cb56",
                    "b1Name": "SARIYAR",
                    "b2Name": "154",
                    "b3Name": "NALLIHA1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 10.797839080459768
                },
                {
                    "sinsid": "253368a7-c41b-4637-9383-5fb9d0d30374",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "KAYACIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:40:00.000Z",
                    "AVG(maxValue)": 18.897045454545452
                },
                {
                    "sinsid": "fd521aaf-3a11-4bec-9f89-23315c526d05",
                    "b1Name": "BAGLICAG",
                    "b2Name": "154",
                    "b3Name": "UMITKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:42:00.000Z",
                    "AVG(maxValue)": 17.849375000000002
                },
                {
                    "sinsid": "5f229307-9134-4a58-8d9e-7cd8cbae13da",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "OSTIMOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 11.300320381731424
                },
                {
                    "sinsid": "8f167ea1-ceb2-464a-8084-e7b898cc9cfc",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "ALACA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 10.768489795918365
                },
                {
                    "sinsid": "02f95310-1def-47f0-81a6-3ba7dd318979",
                    "b1Name": "CIGDEM",
                    "b2Name": "154",
                    "b3Name": "BILKENT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.83706896551724
                },
                {
                    "sinsid": "eb085381-9883-43ba-a2ee-6499be9e5c0d",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:07:00.000Z",
                    "AVG(maxValue)": 11.800374999999997
                },
                {
                    "sinsid": "d8cee981-b906-4963-a92c-d5c173e32889",
                    "b1Name": "YILDIZ",
                    "b2Name": "154",
                    "b3Name": "INCEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.2991212534059948
                },
                {
                    "sinsid": "63e642c6-8118-4461-8d97-437788470c59",
                    "b1Name": "BASTAS",
                    "b2Name": "154",
                    "b3Name": "KIRIKKAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 5.933471749489449
                },
                {
                    "sinsid": "cc42e7a8-b53b-4aec-9f06-30d594677381",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "AKKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 22.252019034670294
                },
                {
                    "sinsid": "705ddc10-ec81-4d79-8b1f-a8a258bc396f",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:08:00.000Z",
                    "AVG(maxValue)": 13.050672268907565
                },
                {
                    "sinsid": "569e6344-4bf1-4ddd-9b78-91bed504f930",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.5872653061224486
                },
                {
                    "sinsid": "fbde270b-e50b-4360-a2bc-9f23b0c91a73",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.596571428571428
                },
                {
                    "sinsid": "cf5f00ba-378d-40fe-8bae-d6b43a413c0d",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.14490553306343
                },
                {
                    "sinsid": "f05e58a1-1177-4f64-ac8a-30929934d4b2",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "BAKENERJ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 18.048491735537194
                },
                {
                    "sinsid": "f87757d6-0f25-4298-9c97-fc0746fc5536",
                    "b1Name": "HACILAR",
                    "b2Name": "154",
                    "b3Name": "KIRDEMIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.373893581081077
                },
                {
                    "sinsid": "f9425fd2-e486-46bc-b7c1-22c827524d03",
                    "b1Name": "MISLIOVA",
                    "b2Name": "154",
                    "b3Name": "NIGDE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.396988443235895
                },
                {
                    "sinsid": "2f38aabf-9c4f-4f50-9b18-474a720ac2fc",
                    "b1Name": "CIMPOR",
                    "b2Name": "154",
                    "b3Name": "K.KALE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 1.971493860845839
                },
                {
                    "sinsid": "d1c3c52f-0340-46c9-b670-c8fb2bb802c0",
                    "b1Name": "KAYACIK",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:40:00.000Z",
                    "AVG(maxValue)": 21.44396103896103
                },
                {
                    "sinsid": "91b5313f-fbba-4dfd-8c2a-10436595c3a9",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "TAKSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.638720217835262
                },
                {
                    "sinsid": "2d2ce2a5-a1eb-4008-8daf-828c7aa8bd66",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "DDYPINAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.12700723327306
                },
                {
                    "sinsid": "41ecac27-4cca-414e-aded-094f28c93025",
                    "b1Name": "ERKILET",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.914468664850137
                },
                {
                    "sinsid": "9785c3ad-899e-4ffc-9226-968fc41d14ad",
                    "b1Name": "NEVSEHIR",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.301059413027913
                },
                {
                    "sinsid": "f6ad8288-d996-40b8-91e5-44d44b065839",
                    "b1Name": "NIGDECIM",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:28:00.000Z",
                    "AVG(maxValue)": 30.54
                },
                {
                    "sinsid": "768ad1f9-5890-4e95-9900-8c156f62821e",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "KAYSERI4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.916348773841962
                },
                {
                    "sinsid": "8dbcc369-ace2-43f9-a5d6-b248565a57eb",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "YAHYALI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -24.534111888111887
                },
                {
                    "sinsid": "42c17057-c20a-4a39-ba79-c7e12fb1866f",
                    "b1Name": "KALECIK",
                    "b2Name": "154",
                    "b3Name": "AKYURT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.052787878787878
                },
                {
                    "sinsid": "22b85ff6-9006-411b-898d-ff3683fd0eee",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "CIMPOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.187011572498297
                },
                {
                    "sinsid": "7ecb6381-0a0c-4f87-8c83-eafa686386ed",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "AKSURES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -29.913867132867136
                },
                {
                    "sinsid": "024ef306-29eb-4430-b10f-55a019b21fe9",
                    "b1Name": "S.KOCHIS",
                    "b2Name": "154",
                    "b3Name": "KIZILIRM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 11.452426520847569
                },
                {
                    "sinsid": "ede75dde-197d-4837-9eba-67ce832e4d72",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "KARAPIN2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:05:00.000Z",
                    "AVG(maxValue)": 11.938872180451128
                },
                {
                    "sinsid": "1e466f0d-2d3b-4772-b583-6d9bf6b304c5",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "KARAPIN1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:06:00.000Z",
                    "AVG(maxValue)": 11.667035714285714
                },
                {
                    "sinsid": "77b188e8-e917-437e-afe3-2d9c9ce0ab09",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "BASTAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.5002721088435376
                },
                {
                    "sinsid": "5c629b1a-c36d-450d-b2be-df4420cce1f6",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "KALECIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 5.943403675970048
                },
                {
                    "sinsid": "3b209f74-b2e4-4a2b-b198-a4ae7f26368d",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "LADIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 7.473963290278721
                },
                {
                    "sinsid": "6cf3554d-b0cd-42d5-86f6-cd05d8373526",
                    "b1Name": "YAZIR",
                    "b2Name": "154",
                    "b3Name": "KONYACIM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 25.30296224588577
                },
                {
                    "sinsid": "e38e8959-247a-4337-b9b6-b1e3a523fd44",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 28.768158179848314
                },
                {
                    "sinsid": "7f34cd91-219f-4c38-8126-dd04ca0e370e",
                    "b1Name": "AKDAGMDN",
                    "b2Name": "154",
                    "b3Name": "SIZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 3.8350662251655625
                },
                {
                    "sinsid": "567134c8-25aa-4071-8f91-d3783d6e340f",
                    "b1Name": "CAMINBAS",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.60102511880516
                },
                {
                    "sinsid": "61248679-2f8a-42f1-b306-1ed618837215",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "TR_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 19.88332496863237
                },
                {
                    "sinsid": "51e36798-b1d9-47c2-9fad-852b7158534b",
                    "b1Name": "KARAMANO",
                    "b2Name": "154",
                    "b3Name": "KARAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -5.9330020422055805
                },
                {
                    "sinsid": "dedae6b6-a26d-4291-b61a-f5fda3adcfa2",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "URGUP-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 12.503122017723246
                },
                {
                    "sinsid": "16f26523-4952-4b93-8142-9d7b7bb16417",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "MACUNKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.999823249490142
                },
                {
                    "sinsid": "2a97d53a-82be-40a1-806d-237b4ff9e045",
                    "b1Name": "ESMEKAYA",
                    "b2Name": "154",
                    "b3Name": "TUMOSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -8.975211171662124
                },
                {
                    "sinsid": "47acae88-20c3-448c-be12-2daccbeeb437",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "KEPEZKYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.674816076294277
                },
                {
                    "sinsid": "129be331-395d-4b83-a2e9-0832fdee5b0a",
                    "b1Name": "ESENBOGA",
                    "b2Name": "154",
                    "b3Name": "AKYURT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 8.636278911564624
                },
                {
                    "sinsid": "2c9095a2-da79-4b9b-bc55-30895b19f28d",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "ETI-SODA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 13.551966426858511
                },
                {
                    "sinsid": "7048b0c7-5ac5-460b-99e9-260773ba2930",
                    "b1Name": "BEYLIKKO",
                    "b2Name": "154",
                    "b3Name": "DDYSAZAK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:44:00.000Z",
                    "AVG(maxValue)": 4.087936507936507
                },
                {
                    "sinsid": "55129094-c7ce-4584-ad8b-815f33b33a23",
                    "b1Name": "MERAMGIS",
                    "b2Name": "154",
                    "b3Name": "ERENKOYG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 14.42858599592114
                },
                {
                    "sinsid": "32cc9deb-e940-4d8f-a7ca-3450f815ed4f",
                    "b1Name": "KPZKAYHS",
                    "b2Name": "154",
                    "b3Name": "KEPEZKAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.64618487394958
                },
                {
                    "sinsid": "8f84cc26-a735-49d1-bf9c-b7f7b9732e42",
                    "b1Name": "GURSOGUT",
                    "b2Name": "154",
                    "b3Name": "KARGIHES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 21.610342261904766
                },
                {
                    "sinsid": "89958ea6-dd7a-4c28-bf0c-dbbf9a6baec8",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "GOLBASI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -76.40791627021882
                },
                {
                    "sinsid": "8c09fae2-cd13-4829-a81b-97b9501fee56",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "380",
                    "b3Name": "GOLBASI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -75.4667570621469
                },
                {
                    "sinsid": "c1a3f123-e019-4089-907e-84afb5f6569d",
                    "b1Name": "DAGYAKA",
                    "b2Name": "154",
                    "b3Name": "KAZAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": 2.345439560439561
                },
                {
                    "sinsid": "41f1dbb7-9114-49d7-9573-d1c6d9dfdb3f",
                    "b1Name": "KALECIK",
                    "b2Name": "154",
                    "b3Name": "KIRIKKAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -4.413589021815622
                },
                {
                    "sinsid": "cbc80bf5-6c3f-4df2-95eb-e921798fdc31",
                    "b1Name": "KALABA",
                    "b2Name": "154",
                    "b3Name": "BOGAZLYN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 6.348821007502679
                },
                {
                    "sinsid": "e120da4e-5d28-4b62-b806-a9deee090238",
                    "b1Name": "BOGAZLYN",
                    "b2Name": "154",
                    "b3Name": "SORGUN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.2831855388813103
                },
                {
                    "sinsid": "89684bd0-1d90-426e-910b-9471108edd29",
                    "b1Name": "BUSAN",
                    "b2Name": "154",
                    "b3Name": "KONYAOS2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 12.821731266149872
                },
                {
                    "sinsid": "f62a7f61-331f-446b-a535-0dee2a1f7d70",
                    "b1Name": "DDYSEKIL",
                    "b2Name": "154",
                    "b3Name": "YERKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.7427525252525253
                },
                {
                    "sinsid": "5ea79bac-4baf-41a5-a215-c1d48f93f026",
                    "b1Name": "BUSAN",
                    "b2Name": "154",
                    "b3Name": "KONYAOS1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 12.709308578745196
                },
                {
                    "sinsid": "f304753a-96de-4b56-b1ee-6f91d0f907a2",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "G4_BOR-3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 2.8017897371714646
                },
                {
                    "sinsid": "da253351-6057-4abb-8360-7e36e475f47b",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.600724538619275
                },
                {
                    "sinsid": "0f7b268d-6357-4106-b357-0c41e347af8c",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:10:00.000Z",
                    "AVG(maxValue)": 15.243373015873013
                },
                {
                    "sinsid": "2f19c0ed-535a-4815-9166-e080f2e7b6aa",
                    "b1Name": "MISLIOVA",
                    "b2Name": "154",
                    "b3Name": "DERINKUY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -16.74583276682529
                },
                {
                    "sinsid": "dd0c23fb-6a01-465d-9cfd-987e17420ad8",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": 14.79186507936508
                },
                {
                    "sinsid": "a103120e-1ba9-4c05-9e78-a32a21d8a1b6",
                    "b1Name": "SORGUN",
                    "b2Name": "154",
                    "b3Name": "BOGAZLYN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -0.2582593856655289
                },
                {
                    "sinsid": "a8a53706-4eb2-4dff-a22d-11a5a2ca21d1",
                    "b1Name": "KAYSERI4",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -32.17163207547169
                },
                {
                    "sinsid": "febc77fb-2930-4c54-9b51-763ed388e53b",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "OSTIMOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.0062338545207337
                },
                {
                    "sinsid": "5690de87-b486-42c6-9d33-c3612bacf7a9",
                    "b1Name": "CAMINBAS",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.13049089469517
                },
                {
                    "sinsid": "c8aef884-9d4b-46d1-8b93-e43676b4ffc6",
                    "b1Name": "SIVRIHIS",
                    "b2Name": "154",
                    "b3Name": "EMIRDAG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.13064961990325
                },
                {
                    "sinsid": "ce636122-c576-481d-8e7b-b193a846e1c8",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "HACILAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -35.48099319727891
                },
                {
                    "sinsid": "53ee1244-4060-49ee-8929-3c56775164d9",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR6",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.982135061391546
                },
                {
                    "sinsid": "e9a596e7-7b7a-4503-8693-898d87cde051",
                    "b1Name": "CAMINBAS",
                    "b2Name": "154",
                    "b3Name": "KUYULUKR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 5.129218218898708
                },
                {
                    "sinsid": "dd0fea7e-cd60-445e-9e2b-dde1249d6ed3",
                    "b1Name": "INCEK",
                    "b2Name": "154",
                    "b3Name": "YILDIZ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 3.0977057356608473
                },
                {
                    "sinsid": "30e63cf7-a760-4246-b2b4-775d84714e4f",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "URGUP-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.320040844111642
                },
                {
                    "sinsid": "1bad3be4-45c4-4555-90ad-8f542a4d9112",
                    "b1Name": "KAZAN",
                    "b2Name": "154",
                    "b3Name": "UZAYOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 10.844498977505111
                },
                {
                    "sinsid": "ebda28a7-9e78-4fd1-b8bd-24eab6bb8fb5",
                    "b1Name": "OSTIMOSB",
                    "b2Name": "154",
                    "b3Name": "MACUNKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.10140231449966
                },
                {
                    "sinsid": "22b212df-2ad8-4044-8478-d5258e21e151",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "CAMLICA1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 14.628069852941175
                },
                {
                    "sinsid": "98d7f150-9284-43c2-8862-30c050edbbba",
                    "b1Name": "BOR",
                    "b2Name": "154",
                    "b3Name": "G4-BOR-3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.307108843537415
                },
                {
                    "sinsid": "efc03c8a-143e-4c20-a3da-ad1ca0d0b572",
                    "b1Name": "MENEKSER",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:10:00.000Z",
                    "AVG(maxValue)": 11.35244
                },
                {
                    "sinsid": "601508af-1b59-43a4-acdf-eff086639538",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR5",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.99010204081633
                },
                {
                    "sinsid": "dec614e3-c475-4538-9bf8-1db1f84215ba",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "YESILHSR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -223.02069320521622
                },
                {
                    "sinsid": "a8df8d3f-a383-43f9-8b98-63318b131746",
                    "b1Name": "AKYURT",
                    "b2Name": "154",
                    "b3Name": "ESENBOGA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -7.094381778741866
                },
                {
                    "sinsid": "3ce37be9-d68e-4ed1-818e-1f40b25225e1",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "G4_BOR-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -1.852290462427746
                },
                {
                    "sinsid": "78ebc620-13d1-46e0-8042-f32596b45f23",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.179467213114748
                },
                {
                    "sinsid": "84b066c1-8e44-4338-834e-21eace75b8e3",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "KNYAOSB2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.565010266940452
                },
                {
                    "sinsid": "97f196aa-d504-4055-89d4-d536606bdbe7",
                    "b1Name": "SIZIR",
                    "b2Name": "154",
                    "b3Name": "AKDAGMDN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.031845940319222
                },
                {
                    "sinsid": "b7d1bfa7-68a2-410c-becb-9e066950a6cc",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "RGKYKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:03:00.000Z",
                    "AVG(maxValue)": 5.50858695652174
                },
                {
                    "sinsid": "ca383e05-1f22-4bde-ab1a-6887cc98d3c0",
                    "b1Name": "PINARBAS",
                    "b2Name": "154",
                    "b3Name": "ELBIST-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -0.6708038147138963
                },
                {
                    "sinsid": "88a679a5-faa1-467b-babd-0e0dd3ecf949",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "CINKUR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 7.747246080436266
                },
                {
                    "sinsid": "a90d5fbc-9062-4418-9c76-702436fcc83e",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "ALCI-TEM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -36.824038069340574
                },
                {
                    "sinsid": "752192d9-54d6-44f1-bf12-6c86c23200a6",
                    "b1Name": "MENEKSER",
                    "b2Name": "154",
                    "b3Name": "BEYYURDU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": 11.278958333333334
                },
                {
                    "sinsid": "9af69c26-e734-4c06-ac46-b60668c3b490",
                    "b1Name": "ESMEKAYA",
                    "b2Name": "154",
                    "b3Name": "KIZOREN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.719571136827776
                },
                {
                    "sinsid": "f8a64114-bd8a-4927-8b71-d02af4b786fe",
                    "b1Name": "KAPULUKA",
                    "b2Name": "154",
                    "b3Name": "HACILAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.408473541383989
                },
                {
                    "sinsid": "4d2a7dfc-89d0-4627-ba3e-52284a18281b",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "KUTUKLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -6.287372742200327
                },
                {
                    "sinsid": "012b7e6d-2c68-42d2-933b-15f512d0f202",
                    "b1Name": "ESMEKAYA",
                    "b2Name": "154",
                    "b3Name": "TUZGOLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 16.159326765188837
                },
                {
                    "sinsid": "fd3f27cd-7cb7-4f4f-8423-2e8766c2f9be",
                    "b1Name": "KAZAN",
                    "b2Name": "154",
                    "b3Name": "DAGYAKA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.55162457337884
                },
                {
                    "sinsid": "0a49da56-2ca0-48a8-8d54-9aa909d08c79",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "KNYAOSB1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.0603210382513666
                },
                {
                    "sinsid": "c4b98ef2-d744-425f-93b2-1dcb04fb104c",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "ATAKALE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.115023761031907
                },
                {
                    "sinsid": "7f5d756e-c079-4ebf-aca5-e3bd7edf8f3f",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR7",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.39293137254902
                },
                {
                    "sinsid": "409fd207-50ca-4456-9eb7-1b4db285c2b5",
                    "b1Name": "KALECIK",
                    "b2Name": "154",
                    "b3Name": "YAKINKEN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.171721027064538
                },
                {
                    "sinsid": "d24ce31e-2abd-423d-8a74-63feb8dc88d5",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR8",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.24693805309734
                },
                {
                    "sinsid": "f452b8c1-ad90-406b-823a-f2e88be9e70a",
                    "b1Name": "KONYAOSB",
                    "b2Name": "154",
                    "b3Name": "KONYAKZ2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.559047619047618
                },
                {
                    "sinsid": "6fb1efd1-3862-425f-9618-1c50db2a6d6a",
                    "b1Name": "POLATLI",
                    "b2Name": "154",
                    "b3Name": "DDYKOCAH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -31.036341961852855
                },
                {
                    "sinsid": "9788f5bc-345c-46d9-9f2d-6d74156e7c38",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.04674418604651
                },
                {
                    "sinsid": "86f18091-dbca-4b45-86b8-061cdc1c7a3c",
                    "b1Name": "SORGUN",
                    "b2Name": "154",
                    "b3Name": "BEYYURDU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.115094736842103
                },
                {
                    "sinsid": "91cd017b-5034-4eb2-9856-fb728f6a5671",
                    "b1Name": "MENEKSER",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:10:00.000Z",
                    "AVG(maxValue)": 11.336041666666665
                },
                {
                    "sinsid": "bbb24868-ca72-4bad-adf0-f98eb5736eb1",
                    "b1Name": "AKYEL-2",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.095633514986377
                },
                {
                    "sinsid": "f9570166-51e2-4ca6-b100-b08e77fd0fb3",
                    "b1Name": "AKDAGMDN",
                    "b2Name": "154",
                    "b3Name": "ARTOVACM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -9.371568381430363
                },
                {
                    "sinsid": "f5edd006-21f9-40eb-b396-26ad3bee559d",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.661495198902601
                },
                {
                    "sinsid": "8334cacb-afa6-4028-b6ee-c54906dfc437",
                    "b1Name": "KALECIK",
                    "b2Name": "154",
                    "b3Name": "DDYIZZET",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:43:00.000Z",
                    "AVG(maxValue)": 4.30431506849315
                },
                {
                    "sinsid": "e79dde70-a633-4524-8873-548e8ed0b154",
                    "b1Name": "KAZAN",
                    "b2Name": "154",
                    "b3Name": "KIZILCAH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 9.567857142857141
                },
                {
                    "sinsid": "a29cab1d-5038-494f-afb9-a0da8b2a11b5",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "ANKARASA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.4624285714285716
                },
                {
                    "sinsid": "e0373d07-fe5b-46fc-b038-4a38fc1fab4c",
                    "b1Name": "KONYAOSB",
                    "b2Name": "154",
                    "b3Name": "KONYAKZ1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.182107409925221
                },
                {
                    "sinsid": "992b337a-fe4d-4886-9fd9-b23f07d7dfdb",
                    "b1Name": "SARKISLA",
                    "b2Name": "154",
                    "b3Name": "PINARBAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.734342194955691
                },
                {
                    "sinsid": "1485ad5f-369f-4400-80ae-349d102a2322",
                    "b1Name": "EMIRLER",
                    "b2Name": "154",
                    "b3Name": "ASELSANM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 11.622445355191259
                },
                {
                    "sinsid": "136a9f87-5adc-4e1f-a47a-c7f099fa5dc6",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.9645641527913806
                },
                {
                    "sinsid": "8edaba4a-d0e3-42f4-bde7-0830c629a796",
                    "b1Name": "CIMPOR",
                    "b2Name": "154",
                    "b3Name": "KAYAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.934196185286103
                },
                {
                    "sinsid": "2a3dcae8-5151-4659-890b-1e8163095054",
                    "b1Name": "NIGDE",
                    "b2Name": "154",
                    "b3Name": "NIGDECIM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 11.765289957567187
                },
                {
                    "sinsid": "97acd3cf-bf35-457a-b812-95044200809a",
                    "b1Name": "ETI-SODA",
                    "b2Name": "154",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -13.464993045897081
                },
                {
                    "sinsid": "c3645fc6-4e5e-4bec-be2c-4b525964571c",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.5369544527532284
                },
                {
                    "sinsid": "189a6770-a56c-4330-ad0b-cf0c1be3ab83",
                    "b1Name": "BEYLIKKO",
                    "b2Name": "154",
                    "b3Name": "DDYBEYLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:44:00.000Z",
                    "AVG(maxValue)": 1.0781538461538462
                },
                {
                    "sinsid": "47bc10da-0571-4128-a374-a85e7819ec86",
                    "b1Name": "OSTIMOSB",
                    "b2Name": "154",
                    "b3Name": "ANKARASA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.1877414965986395
                },
                {
                    "sinsid": "074ffd10-363e-45f8-98ae-20e6dc2c17f4",
                    "b1Name": "YAZIR",
                    "b2Name": "154",
                    "b3Name": "MERAMGIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.8957833787465939
                },
                {
                    "sinsid": "48dd4202-e8fc-48a6-89b5-bc654963c038",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "KAYSERI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.071103542234333
                },
                {
                    "sinsid": "1e7d7775-11fb-42ef-ab93-20e1bce153da",
                    "b1Name": "KALABA",
                    "b2Name": "154",
                    "b3Name": "DDYPASAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 1.6770347003154575
                },
                {
                    "sinsid": "49477405-e7f0-421e-a3f9-aa8f730ed65a",
                    "b1Name": "NIGDEOSB",
                    "b2Name": "154",
                    "b3Name": "BOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.455802721088435
                },
                {
                    "sinsid": "749ef585-a36c-4064-a58d-bdbbf2ed94d8",
                    "b1Name": "YIBITAS",
                    "b2Name": "154",
                    "b3Name": "YOZGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -44.166486291486294
                },
                {
                    "sinsid": "ce1b72a5-47f3-404a-a9ad-d8c40afd0593",
                    "b1Name": "MERAMGIS",
                    "b2Name": "154",
                    "b3Name": "YAZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 1.6432757325319314
                },
                {
                    "sinsid": "479754c5-676e-4b47-afa0-187cf0fc79d1",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "RGKYKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:31:00.000Z",
                    "AVG(maxValue)": 3.125991525423729
                },
                {
                    "sinsid": "a9f8756c-18d1-4444-8f41-33f653e177e9",
                    "b1Name": "TEKSINGE",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 2.175816326530612
                },
                {
                    "sinsid": "87d17289-9c3f-45dc-9699-5bf492964a4e",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "LADIK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 1.2694104803493451
                },
                {
                    "sinsid": "f7699aa1-c6ca-416e-85d9-e1b3d5325f61",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "LADIK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.8872454212454212
                },
                {
                    "sinsid": "ed3dc295-17b9-4e10-9bcb-2f0564e56ffd",
                    "b1Name": "BOGAZLYN",
                    "b2Name": "154",
                    "b3Name": "KALABA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -5.368310626702997
                },
                {
                    "sinsid": "793992b6-a182-4b67-9b44-6bf8d8e1d119",
                    "b1Name": "YAYSUNGE",
                    "b2Name": "154",
                    "b3Name": "EREGLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.232923181509175
                },
                {
                    "sinsid": "4eaa703d-4f12-4e97-9ec8-91af9f91a7ca",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "TR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:45:00.000Z",
                    "AVG(maxValue)": 6.01061224489796
                },
                {
                    "sinsid": "b8bb7948-cd8e-40ed-84cf-171d0bf3c8a8",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "YAYSUNGE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -15.823238161559887
                },
                {
                    "sinsid": "2d3ebbe3-5707-4b5a-9258-40e2108398da",
                    "b1Name": "NIGDE",
                    "b2Name": "154",
                    "b3Name": "MISLIOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -12.88477195371001
                },
                {
                    "sinsid": "9a8d3df8-54c8-42f9-9b49-7d34a18af544",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "CINKUR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.637392784206945
                },
                {
                    "sinsid": "11b30b78-2094-4b92-8508-bbd1967d44c6",
                    "b1Name": "LADIK",
                    "b2Name": "154",
                    "b3Name": "KONYAKZ2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -0.7571966527196654
                },
                {
                    "sinsid": "2d9e22f7-cc64-4faf-9e4a-e8b48b936301",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "G4_BOR-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -21.475990950226247
                },
                {
                    "sinsid": "3da760d5-2bad-4040-97bc-6258194f62ee",
                    "b1Name": "HASKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.681166439290587
                },
                {
                    "sinsid": "cefa976a-add5-4442-84ff-01c27b9b043b",
                    "b1Name": "YERKOY",
                    "b2Name": "154",
                    "b3Name": "CAYDOGAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 0.10005241090146748
                },
                {
                    "sinsid": "989f2013-b21f-4fea-85ec-45d1cbb23cab",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "CINKUR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.18221088435374
                },
                {
                    "sinsid": "cf5bb48e-749f-4ee4-b65f-52a31adadb24",
                    "b1Name": "ADATOPRK",
                    "b2Name": "154",
                    "b3Name": "DDYCAYIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -23.801257575757578
                },
                {
                    "sinsid": "cd3a08e8-6aaa-443d-91fa-aabc9a78fd6c",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "ERKILET",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.610476514635808
                },
                {
                    "sinsid": "c4afe802-a494-475a-9c86-42f1e10c1fb4",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "SENDIREM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.716730115567639
                },
                {
                    "sinsid": "ba4a95d3-934e-4431-b674-47185978647f",
                    "b1Name": "YERKOY",
                    "b2Name": "154",
                    "b3Name": "YIBITAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.199955385595924
                },
                {
                    "sinsid": "7c48d582-ba36-45df-9ad6-0402551153a5",
                    "b1Name": "KONYAOSB",
                    "b2Name": "154",
                    "b3Name": "BUSAN2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.281772324471711
                },
                {
                    "sinsid": "50600a5c-72f0-4784-8007-328e7a5a2602",
                    "b1Name": "LADIK",
                    "b2Name": "154",
                    "b3Name": "KONYAKZ1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.81729674796748
                },
                {
                    "sinsid": "92351449-ac99-428a-807c-211c83ea9cef",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "SKOCHISA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.460047586675733
                },
                {
                    "sinsid": "c8c5d27f-afbd-47e8-8c1a-aa695ebe491f",
                    "b1Name": "DEL51",
                    "b2Name": "154",
                    "b3Name": "GenSumP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:17:00.000Z",
                    "AVG(maxValue)": 1.35
                },
                {
                    "sinsid": "3dde8451-bee4-4516-9e2b-2f26c9d8163f",
                    "b1Name": "KAYSERI4",
                    "b2Name": "154",
                    "b3Name": "URGUP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -7.482405462184874
                },
                {
                    "sinsid": "95720a48-dde5-432c-8173-b8542accb10a",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "KIZILIRM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.746569094622194
                },
                {
                    "sinsid": "afe10a70-46a7-45ec-9994-668183f57993",
                    "b1Name": "CIGDEM",
                    "b2Name": "154",
                    "b3Name": "UMITKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.783394683026584
                },
                {
                    "sinsid": "fb827e66-f30e-4ef6-90b6-a28891a8e5a4",
                    "b1Name": "KAYACIK",
                    "b2Name": "154",
                    "b3Name": "BAGLAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": -22.34713692946058
                },
                {
                    "sinsid": "6d5221de-194f-4b76-aaa2-644743ada0e1",
                    "b1Name": "KONYAOSB",
                    "b2Name": "154",
                    "b3Name": "BUSAN1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.403160762942781
                },
                {
                    "sinsid": "da272915-d3df-4987-ad7c-fce319a2b88e",
                    "b1Name": "CIGDEM",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.84491769547325
                },
                {
                    "sinsid": "83e234d3-bb38-4da5-9954-e2e77abd1ceb",
                    "b1Name": "KIZOREN",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -27.08769387755101
                },
                {
                    "sinsid": "a63c9630-d012-481c-a6ae-827c41b8e51e",
                    "b1Name": "SARKISLA",
                    "b2Name": "154",
                    "b3Name": "VOTORANT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -22.251956373551465
                },
                {
                    "sinsid": "d13de74a-dc4a-41cf-a7a8-339952ed65da",
                    "b1Name": "KIRSEHIR",
                    "b2Name": "154",
                    "b3Name": "YERKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -23.122767695099814
                },
                {
                    "sinsid": "d9bd8154-7dfa-4f1c-87d3-92f9ad22ce8d",
                    "b1Name": "KULU",
                    "b2Name": "154",
                    "b3Name": "CIHANBEY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.294573960463527
                },
                {
                    "sinsid": "e2399714-87dc-415c-b4cb-f1b7469b61ef",
                    "b1Name": "BILKENTG",
                    "b2Name": "154",
                    "b3Name": "CIGDEM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:55:00.000Z",
                    "AVG(maxValue)": -16.414545454545458
                },
                {
                    "sinsid": "e9ba9a06-d349-4d68-bc8f-bbe61b3b72fc",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "KEBAN-2G",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -558.4161739130436
                },
                {
                    "sinsid": "49de0a3b-d055-4ede-8c1f-a58c7d311bc5",
                    "b1Name": "TAKSAN",
                    "b2Name": "154",
                    "b3Name": "SENDIREM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -12.407115646258502
                },
                {
                    "sinsid": "c4c01d6e-51a4-4cdc-88ef-fc8c1c4f04a6",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:27:00.000Z",
                    "AVG(maxValue)": 1.676304347826087
                },
                {
                    "sinsid": "f33a3459-c53e-4eaf-9f7c-1f4e5976abe7",
                    "b1Name": "ALTINOVA",
                    "b2Name": "154",
                    "b3Name": "KOLUKISA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -29.175475051264527
                },
                {
                    "sinsid": "721b79a8-3b4a-4ab5-a3e1-438077494044",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T17:53:00.000Z",
                    "AVG(maxValue)": 2.4217857142857144
                },
                {
                    "sinsid": "efb9b7b7-321a-40ca-a419-5e29e117757e",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.305483651226155
                },
                {
                    "sinsid": "fb8fa8a8-cbdc-4beb-a4d7-65affc5ce3e7",
                    "b1Name": "ANK-DGKC",
                    "b2Name": "154",
                    "b3Name": "swGenGT2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:17:00.000Z",
                    "AVG(maxValue)": 0.6983333333333334
                },
                {
                    "sinsid": "44d09007-1cbc-43b6-8d5e-ad65e12080d4",
                    "b1Name": "A.HOYUGU",
                    "b2Name": "154",
                    "b3Name": "CUMRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -30.02586820083682
                },
                {
                    "sinsid": "6b02021c-73ab-42ab-b282-7837eeaf5e6a",
                    "b1Name": "MAMAK",
                    "b2Name": "154",
                    "b3Name": "KAYAS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.514914675767915
                },
                {
                    "sinsid": "8ffb57c9-1efa-4301-b928-2d94fc84aabd",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "TR_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -2.9649014778325125
                },
                {
                    "sinsid": "7a9bf0f1-4473-4d9d-a9fa-b89c1adf80f0",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.3759768550034
                },
                {
                    "sinsid": "1ac733cc-c23b-472f-9dcc-7627fa5dff77",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "YAMULA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -74.13760344827584
                },
                {
                    "sinsid": "bf67e654-0ce8-4172-8d35-c4b4276f0bea",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T11:36:00.000Z",
                    "AVG(maxValue)": 2.59
                },
                {
                    "sinsid": "1a48bfaf-5ff2-4f94-b630-a35f7bb8ea87",
                    "b1Name": "YAMULAHS",
                    "b2Name": "154",
                    "b3Name": "swGTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -39.423707865168545
                },
                {
                    "sinsid": "69fc1bfc-befe-4c75-b925-cfe5a8a1a5aa",
                    "b1Name": "ANK-DGKC",
                    "b2Name": "154",
                    "b3Name": "swGenGT1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:17:00.000Z",
                    "AVG(maxValue)": -0.41875
                },
                {
                    "sinsid": "0d8385a8-bda0-46d0-95d2-c2e01c6aeec8",
                    "b1Name": "KOLUKISA",
                    "b2Name": "154",
                    "b3Name": "DDYGOZLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -37.80308396946565
                },
                {
                    "sinsid": "de857bde-90ba-49ed-a9bc-7a262ffef22c",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:58:00.000Z",
                    "AVG(maxValue)": -8.973737373737375
                },
                {
                    "sinsid": "fe5d6b03-8fa1-4068-9979-0825b8a05e1c",
                    "b1Name": "S.KOCHIS",
                    "b2Name": "154",
                    "b3Name": "ATARES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.507060027285128
                },
                {
                    "sinsid": "93fc3ebc-78ae-4966-b768-cff457a881e6",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -45.83460272011453
                },
                {
                    "sinsid": "5cf69399-fa69-45ac-8e6d-893c2693840f",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.65266348773842
                },
                {
                    "sinsid": "88c05e86-5680-486e-a84f-c9098455c06f",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.656058543226685
                },
                {
                    "sinsid": "21650183-fc0d-4828-b1db-d1b0f45538f9",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "BOSHAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:24:00.000Z",
                    "AVG(maxValue)": 1.5249999999999997
                },
                {
                    "sinsid": "7626a510-3d75-49d7-82cc-d3acef11199c",
                    "b1Name": "BOROSB",
                    "b2Name": "154",
                    "b3Name": "BOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -39.709547477744806
                },
                {
                    "sinsid": "35e45bbd-8da0-4d76-91c9-ac92987c1049",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "EREGLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -43.143523809523806
                },
                {
                    "sinsid": "cc4fc0a5-ca94-46d9-b10f-0de97255783e",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "HIRFANL1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.680968523002421
                },
                {
                    "sinsid": "f74299bb-cde7-4e6f-8200-ca95ad958439",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "YESILHSR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 1.5064247517188694
                },
                {
                    "sinsid": "cb9f90fa-4ae0-42fd-a803-155328c2a055",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.188345813478557
                },
                {
                    "sinsid": "cfff098d-9b8f-4a3d-9c05-88016239fb87",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.188223281143634
                },
                {
                    "sinsid": "7688dc36-66ed-4f3f-8a68-9649e13bb125",
                    "b1Name": "CEKERKHV",
                    "b2Name": "154",
                    "b3Name": "KARALIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -18.566841692789968
                },
                {
                    "sinsid": "ad24945c-e93a-4acc-a523-c1e952373737",
                    "b1Name": "KARALIKR",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -17.87430016863406
                },
                {
                    "sinsid": "d75a2825-852a-4024-8aeb-ecba8d458b28",
                    "b1Name": "KARALIKR",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -17.874300168634065
                },
                {
                    "sinsid": "d780a641-32ce-4d89-8a24-31034c917510",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "CAMINBAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -4.4470816326530604
                },
                {
                    "sinsid": "4607bfe0-a10f-4877-8031-7f5bc238579b",
                    "b1Name": "CAMINBAS",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -4.42204344874406
                },
                {
                    "sinsid": "25e32d5d-c71d-4beb-8c37-26be8ae5619f",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "swGTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:19:00.000Z",
                    "AVG(maxValue)": 0.7716666666666666
                },
                {
                    "sinsid": "b3a56953-07cb-485a-8df4-390926ff8837",
                    "b1Name": "KEPEZKAY",
                    "b2Name": "154",
                    "b3Name": "AYBASTI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -33.07516218081436
                },
                {
                    "sinsid": "f1357ef9-f4c4-436a-8516-d2926ae5106b",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -38.97383570943653
                },
                {
                    "sinsid": "e41fe909-7799-4490-926a-7af511b6a60d",
                    "b1Name": "ANK-DGKC",
                    "b2Name": "154",
                    "b3Name": "swGenST",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 1.11
                },
                {
                    "sinsid": "4ed9bbb3-fe69-42f0-b235-e40bdda415c0",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "BEYPAZAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -11.185463756819955
                },
                {
                    "sinsid": "73bc3d53-1d56-42da-a365-8424740407ff",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "B.HACILI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T20:49:00.000Z",
                    "AVG(maxValue)": -19.246538461538464
                },
                {
                    "sinsid": "86cd9d0d-e5c9-48b4-b3bd-92bff3f9a74c",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "swGTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:19:00.000Z",
                    "AVG(maxValue)": 0.5005128205128205
                },
                {
                    "sinsid": "014c76b0-4515-4bab-b50f-1c198cd5a42d",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "CAMLICA3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.75402035623409
                },
                {
                    "sinsid": "012cb66d-f2ae-417a-8ce3-de73ac25c252",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "ANKDG-G1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:37:00.000Z",
                    "AVG(maxValue)": 0.7076288659793815
                },
                {
                    "sinsid": "6be64983-3768-4878-8fa3-007f59afd46d",
                    "b1Name": "KARATAY",
                    "b2Name": "380",
                    "b3Name": "MERSIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T06:20:00.000Z",
                    "AVG(maxValue)": 0.36
                },
                {
                    "sinsid": "d157028e-cc8b-4e9e-8d03-de55d785bf15",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:13:00.000Z",
                    "AVG(maxValue)": -20.093624823695347
                },
                {
                    "sinsid": "f5ad9011-e8aa-48db-b91b-4140ebc1d722",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "swTR_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:13:00.000Z",
                    "AVG(maxValue)": -10.276487341772151
                },
                {
                    "sinsid": "13bd0a22-1695-453a-a818-c61708ffac6f",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "K.A.GES1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": -7.700560975609756
                },
                {
                    "sinsid": "e0e9cad9-f148-4bc7-aad4-baea96b5f583",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "URGUP1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -22.931130020422057
                },
                {
                    "sinsid": "e689bf6f-2b3d-49fe-a4a9-f8e7eddb430c",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "K.A.GES2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -6.475125
                },
                {
                    "sinsid": "e89de3e6-9772-4608-94d8-c83002e195eb",
                    "b1Name": "LADIK",
                    "b2Name": "154",
                    "b3Name": "KUYULUKO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.851255813953489
                },
                {
                    "sinsid": "7e4e9290-288f-4661-8f15-d7e6ffdf95bb",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "swTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T08:49:00.000Z",
                    "AVG(maxValue)": 0.65
                },
                {
                    "sinsid": "dece3563-3a4c-406d-8a67-55bf4a3f07d8",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -5.524044233807267
                },
                {
                    "sinsid": "8b70a68c-42f6-45b5-a368-a84925da9ae7",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.125346467391303
                },
                {
                    "sinsid": "19b153eb-6e05-450f-8130-f73663a291f0",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "swGTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -96.71608635097492
                },
                {
                    "sinsid": "4907bed6-e360-4b92-8881-23fcf564cd10",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.808004073319754
                },
                {
                    "sinsid": "433ac9e4-119f-4b93-b1b9-a8eb79923410",
                    "b1Name": "KAPULUKA",
                    "b2Name": "154",
                    "b3Name": "swTR3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.18495587236931432
                },
                {
                    "sinsid": "bd6da6ca-db47-4d12-a94c-35d5ccbf7823",
                    "b1Name": "KAPULUKA",
                    "b2Name": "154",
                    "b3Name": "swTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.7638017651052273
                },
                {
                    "sinsid": "476fc96b-62f5-40b6-85bb-6b67bcc63586",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "swGTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -14.868881818181817
                },
                {
                    "sinsid": "ebd7d412-fb69-4c43-9be3-611e8d21f91e",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "swGTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -11.48427689594356
                },
                {
                    "sinsid": "472f5afd-f7e7-4efb-aa8f-cacf6d235b78",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.4615625
                },
                {
                    "sinsid": "a1fc1792-22df-4bc1-a1d1-b246c13d91fa",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -3.2213389513108615
                },
                {
                    "sinsid": "a8877c91-567a-462c-86ba-515a21f49df8",
                    "b1Name": "KAPULUKA",
                    "b2Name": "154",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.14048168249660786
                },
                {
                    "sinsid": "c140c5f5-5b4e-4520-8d4f-9ec1cdff2892",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -17.138411724608044
                },
                {
                    "sinsid": "691de3a9-1373-4cc6-88c2-bf74d3dd7d7b",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "swGTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -15.14850492390331
                },
                {
                    "sinsid": "d4db714f-285b-4057-a192-d94e927a9f89",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "swTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -17.48225476839237
                },
                {
                    "sinsid": "def8c6e7-9da1-45ff-8d3d-8d5f2823a400",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "swGTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:41:00.000Z",
                    "AVG(maxValue)": -16.965550755939528
                },
                {
                    "sinsid": "f7eb94f5-dfec-419d-9d4f-a701d17a0137",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "swGTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -2.8177155824508313
                },
                {
                    "sinsid": "df2a8209-e58d-449c-a665-e7fc323b191e",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "HIRFANL2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.770178970917227
                },
                {
                    "sinsid": "4ba93890-d444-482f-89b8-6729327fac29",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.691464577656676
                },
                {
                    "sinsid": "c3cbeb6a-0604-4bd8-9c94-0c7eb1997fd6",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "swTR_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:13:00.000Z",
                    "AVG(maxValue)": -10.782055016181229
                },
                {
                    "sinsid": "ea9c8341-6ef8-4c25-9b7b-ad0b411a4279",
                    "b1Name": "MAVIHES",
                    "b2Name": "154",
                    "b3Name": "GUNEYSIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 0.07884228187919463
                },
                {
                    "sinsid": "d9bfdfac-d666-4e8a-b5a0-e2cd889ba37c",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:17:00.000Z",
                    "AVG(maxValue)": -12.094756756756755
                },
                {
                    "sinsid": "0fbb8bac-96a4-43ca-a1e8-d00333dc42fb",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -5.9322763237979315
                },
                {
                    "sinsid": "50c83aa6-099f-4b16-8236-14b55d77375f",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "GEYCEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:37:00.000Z",
                    "AVG(maxValue)": -49.20654247391952
                },
                {
                    "sinsid": "d5bb028a-8167-4384-bf28-f803f81b0e70",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -35.1945417515275
                },
                {
                    "sinsid": "eeedd74d-83d9-42f9-9ecb-69da8c2ae393",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -10.388816388467374
                },
                {
                    "sinsid": "16494384-22e9-4ba5-b5f7-1ba3915b02c2",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "swTR_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -17.68087091757387
                },
                {
                    "sinsid": "42e94846-3784-4acd-9e55-e954be65285a",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -24.562251184834125
                },
                {
                    "sinsid": "4b21c2bd-3b82-401c-abb8-db6eb792c5ce",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "YAHYALI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.137002039428959
                },
                {
                    "sinsid": "fd5b471b-3f31-4550-bb09-302f87143786",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:05:00.000Z",
                    "AVG(maxValue)": -11.09579268292683
                },
                {
                    "sinsid": "ff675594-1fcb-4c83-a0e8-7889ac039586",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "KURTKAYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -19.43213943950786
                },
                {
                    "sinsid": "401cff12-55bb-4ecf-9c19-ddf0fd7bc5ce",
                    "b1Name": "KESIKKOP",
                    "b2Name": "154",
                    "b3Name": "KIZ-KIRI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:39:00.000Z",
                    "AVG(maxValue)": 0.2129230769230769
                },
                {
                    "sinsid": "43d5b36b-f2e0-4cee-a3e0-a157460d2e4e",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -4.246949999999999
                },
                {
                    "sinsid": "e7ce25b7-2ece-4a1c-9c61-9f8d1781079b",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.313983628922237
                },
                {
                    "sinsid": "cbab4d90-3ef9-4ee6-988d-4b48a20178c5",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.3578532110091737
                },
                {
                    "sinsid": "1d84d809-691a-46b9-a6a6-c92f92f3281a",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "swTR_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.575446735395193
                },
                {
                    "sinsid": "914877e7-09d1-4e02-969a-8c014328c904",
                    "b1Name": "TEKSINGE",
                    "b2Name": "154",
                    "b3Name": "swTR-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -1.3108352144469526
                },
                {
                    "sinsid": "0f48ccc6-4d69-4957-ace6-496d19d3490a",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": -14.02824074074074
                },
                {
                    "sinsid": "3b0c7606-0c63-4445-b705-45d1304bb6aa",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.0059211420802168
                },
                {
                    "sinsid": "4a013965-ff69-4383-8745-bf896a4b0fb0",
                    "b1Name": "SARIYAR",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:10:00.000Z",
                    "AVG(maxValue)": 0.16
                },
                {
                    "sinsid": "8d8bd25e-4123-420b-b429-dcf3ec7de7bb",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": -14.02824074074074
                },
                {
                    "sinsid": "15f7ccbd-9a14-4a2b-a8bf-a3ca99cf1717",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -2.779776223776224
                },
                {
                    "sinsid": "235415ba-e096-4ab2-b7a5-c7adc59ac490",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:18:00.000Z",
                    "AVG(maxValue)": -5.408636363636364
                },
                {
                    "sinsid": "d6d3b844-7e6c-4b9a-ab9d-2ea1608def07",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "MNKSERES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": -11.18586956521739
                },
                {
                    "sinsid": "e389b1e0-ad73-48dc-a646-bfb38ac29276",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -5.981148514851484
                },
                {
                    "sinsid": "31ff26ce-b9d4-48c2-a238-d0780fccab74",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.776476608187135
                },
                {
                    "sinsid": "3e190728-d112-4f4e-ae50-e0f7da232bc6",
                    "b1Name": "MENEKSER",
                    "b2Name": "154",
                    "b3Name": "swTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": -10.187010309278351
                },
                {
                    "sinsid": "6f89c0aa-6c8a-438c-a485-1be5a241a478",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.774886613021215
                },
                {
                    "sinsid": "bc98162e-8d08-4062-b7ad-9e10e7d2e304",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "swTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.38624847001224
                },
                {
                    "sinsid": "65353f8f-2377-4c2c-aa10-7828551cf058",
                    "b1Name": "R3KRMN1R",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -48.503789260385005
                },
                {
                    "sinsid": "0aad3d56-109c-4146-873c-d31d385e7822",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:20:00.000Z",
                    "AVG(maxValue)": -2.2494
                },
                {
                    "sinsid": "6db1c272-4950-45e0-af82-3315bf3557c9",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "swGTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:00:00.000Z",
                    "AVG(maxValue)": -7.264541832669323
                },
                {
                    "sinsid": "02a453bd-e21e-4182-b3a0-81671c929051",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "KAYSERI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -31.023904653802493
                },
                {
                    "sinsid": "03ba28a5-663c-4713-b8f0-fca8d1067f5f",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "swSTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:26:00.000Z",
                    "AVG(maxValue)": -1.1286486486486487
                },
                {
                    "sinsid": "06ac7257-92aa-4ca6-9f4c-23730fcdc1d5",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "MAMAK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:59:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "07a25fbf-d437-4a22-b99c-f68a24f567e2",
                    "b1Name": "POLATCMT",
                    "b2Name": "154",
                    "b3Name": "YEDEK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:22:00.000Z",
                    "AVG(maxValue)": -274.9701234567901
                },
                {
                    "sinsid": "07caeeef-a70e-44a0-889c-97292d69e646",
                    "b1Name": "KARGIHS",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "085b8249-e3b5-4eb3-a878-8f6089cb8cde",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "YEDEK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:36:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "096bc8ac-2239-41a0-b934-52eed11760ed",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "YEDEK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:49:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "09a5262b-7eae-4857-8bee-6a0b0b8b6652",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:02:00.000Z",
                    "AVG(maxValue)": -9.319876543209874
                },
                {
                    "sinsid": "09be7bfb-d7eb-459b-9cad-f2226ff35ae3",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:58:00.000Z",
                    "AVG(maxValue)": -10.452974683544301
                },
                {
                    "sinsid": "0ca480d6-2e7e-4dba-93cc-a4c965f3eae7",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "TR_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "13e32871-8d29-4608-bced-7d04c022a4c2",
                    "b1Name": "BUSAN",
                    "b2Name": "154",
                    "b3Name": "HOTAMIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.860299931833676
                },
                {
                    "sinsid": "23628797-fc51-4504-9316-20de316e7736",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "URGUP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:21:00.000Z",
                    "AVG(maxValue)": -219.52285714285716
                },
                {
                    "sinsid": "2770ff8a-89eb-4d5a-9432-cc102c8add52",
                    "b1Name": "BILKENTG",
                    "b2Name": "154",
                    "b3Name": "UMITKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:56:00.000Z",
                    "AVG(maxValue)": -38.08549999999999
                },
                {
                    "sinsid": "2ce14d5b-cf09-4eba-b4a4-6718f78ba3db",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -204.888
                },
                {
                    "sinsid": "30728d8e-19d0-4780-b549-c9179796476a",
                    "b1Name": "NIGDECIM",
                    "b2Name": "154",
                    "b3Name": "NIGDETM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:48:00.000Z",
                    "AVG(maxValue)": -9.293047337278107
                },
                {
                    "sinsid": "453ae384-bb73-4176-810e-fe83039d10e7",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "swTR_MBL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:49:00.000Z",
                    "AVG(maxValue)": -41.85
                },
                {
                    "sinsid": "48d87d71-7ed7-4ae5-88a0-e324067272f8",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "BOZOK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -336.35569913211185
                },
                {
                    "sinsid": "4e286c6b-b217-4783-a98c-758d0d0495af",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "swGTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:26:00.000Z",
                    "AVG(maxValue)": -0.7294736842105264
                },
                {
                    "sinsid": "4e2e44e2-03bd-4ebc-be6f-d08959f88a5a",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "ICANADOL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -135.54524846834582
                },
                {
                    "sinsid": "57b86190-e33c-49a9-9548-d73c8eb40f09",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "swSTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -1.327142857142857
                },
                {
                    "sinsid": "58b4d0e9-eb7f-4209-85ad-68766c0bbf6b",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:21:00.000Z",
                    "AVG(maxValue)": -219.52285714285716
                },
                {
                    "sinsid": "5ee118b3-261c-4bbb-be42-af7a861bdb3f",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "swOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -192.00799999999998
                },
                {
                    "sinsid": "60b4260a-658a-4b0a-96a7-0472d45a34ea",
                    "b1Name": "K.HAMAM",
                    "b2Name": "154",
                    "b3Name": "KAZAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:20:00.000Z",
                    "AVG(maxValue)": -2.3180132450331126
                },
                {
                    "sinsid": "613df61e-4e0b-4bc0-a78f-c60d51f078dd",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "EMIRLER2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -153.648
                },
                {
                    "sinsid": "64bdf9df-6941-4895-9d9b-f81c56e12514",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "swGTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:26:00.000Z",
                    "AVG(maxValue)": -1.4972222222222225
                },
                {
                    "sinsid": "71303b53-60d8-4102-af32-98502cf2a076",
                    "b1Name": "YAMULAHS",
                    "b2Name": "154",
                    "b3Name": "swGTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -39.1148132780083
                },
                {
                    "sinsid": "75d433bc-4076-4003-8718-8a5c3ecfef79",
                    "b1Name": "HOTAMIS",
                    "b2Name": "154",
                    "b3Name": "KARAPINA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.365794137695975
                },
                {
                    "sinsid": "771b84d0-2a37-49a1-9627-2643eb56eff6",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "KAYABASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -308.50982315112543
                },
                {
                    "sinsid": "77fc04bd-dc2c-4c89-8401-d7e0f065d6bd",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "Tran_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "79635a0c-887c-48f6-bfa4-0555560ff340",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "MACUNKO1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -25.19619668246446
                },
                {
                    "sinsid": "7ac1c0da-9fa9-4250-92a7-e66ef6922dd2",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "swOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -192.00799999999998
                },
                {
                    "sinsid": "7b5f9c93-71dd-4f59-a859-b1977221740e",
                    "b1Name": "MAMAK",
                    "b2Name": "154",
                    "b3Name": "KAYAS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:14:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "7e7cf896-0809-448c-81fc-c8ca9b21b0ae",
                    "b1Name": "KONYAKZY",
                    "b2Name": "380",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:50:00.000Z",
                    "AVG(maxValue)": -0.10103448275862069
                },
                {
                    "sinsid": "7ecddb2b-c4e3-45dd-8c41-f52edf18732c",
                    "b1Name": "MAVIHES",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T16:40:00.000Z",
                    "AVG(maxValue)": -0.5463779527559055
                },
                {
                    "sinsid": "8437775c-10d7-4e24-80ec-48605d7b502f",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "G.KAYSER",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -513.9543167912984
                },
                {
                    "sinsid": "8e502489-ad06-410b-a16a-32d997901f3f",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -288.7575
                },
                {
                    "sinsid": "9457e46c-ac20-4975-8eed-97d71eb890e4",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:59:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "9726946d-5027-43b7-895f-f6fe1555388b",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "97a1da87-aacf-4666-8918-d8f44c758996",
                    "b1Name": "BILKENTG",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T09:55:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "996e4935-e681-4af3-a9cc-c0c4ef05a116",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "YAHYALI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "999a1ca1-044d-4481-b973-66e6eff7d37e",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "TR_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "9c485c4f-28ec-40d4-8053-f713fd611c18",
                    "b1Name": "KPZKAYHS",
                    "b2Name": "154",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.42406538139145
                },
                {
                    "sinsid": "a113e68a-2a12-42b8-a9ad-309584fb7bf2",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "a3ebcec3-9574-404c-b401-ebfbf08c7655",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "SINCAN-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "a4933ca3-22b4-4185-b7d5-c6120a937bb0",
                    "b1Name": "MERAMGIS",
                    "b2Name": "154",
                    "b3Name": "SEYDISEH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.530061182868792
                },
                {
                    "sinsid": "a5f1edc4-e547-465c-970a-ef9ed389470d",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "GOLBASI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:59:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "a8d27d6e-ec04-41d7-86da-ae278a230dae",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:26:00.000Z",
                    "AVG(maxValue)": -3.3736538461538457
                },
                {
                    "sinsid": "aafc7e9b-fbd4-4f28-831b-3e458e00dee9",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "YEDEK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:36:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "ac473194-c2d2-4ca6-aef9-37cf07792698",
                    "b1Name": "POLATCMT",
                    "b2Name": "154",
                    "b3Name": "YEDEK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:22:00.000Z",
                    "AVG(maxValue)": -274.97012345679013
                },
                {
                    "sinsid": "afb5aed8-4cb0-472a-b282-064ea7f315ca",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "GEYCEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:21:00.000Z",
                    "AVG(maxValue)": -0.13714285714285715
                },
                {
                    "sinsid": "b0f95830-07f8-4541-b3d2-ccaeb5f37f77",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "b24dada5-d918-4106-9236-c8deba6dcf0a",
                    "b1Name": "ADATOPRK",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:20:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "b34ea654-fa18-4cd2-b5e4-9691caa9afa2",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -192.0825
                },
                {
                    "sinsid": "b55a3335-882b-4923-bcdf-dd3f91676b64",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "K.KAYSER",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -514.5766281441198
                },
                {
                    "sinsid": "b61ec865-84c6-4be6-a3d0-ac48fa297251",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "ba50b595-6dad-4a1a-9543-758d7c0aabe3",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "be31dbb5-2543-4a5e-8b69-0020496b3830",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "SARIYAR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:34:00.000Z",
                    "AVG(maxValue)": -19.104
                },
                {
                    "sinsid": "c6380ab1-0999-4755-b5ca-d2283bffcf5e",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "Tran_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "c6fe398e-facf-4348-ac13-59b84faaf38d",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -288.7575
                },
                {
                    "sinsid": "c77849df-26a9-4342-a836-cb65c3fc1c41",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "c9de1f4e-13bc-4dca-90d5-a6cb5891419e",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "ICANADOL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -204.44073341094298
                },
                {
                    "sinsid": "cc1f8260-52f1-4cd1-9169-1f520e040b82",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "cf6c235a-de30-4bb8-8cdf-720a7fbc604e",
                    "b1Name": "KPZKAYHS",
                    "b2Name": "154",
                    "b3Name": "swTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -12.219277108433737
                },
                {
                    "sinsid": "d27f165f-07dc-446f-8576-6ff7bdbf2803",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -480.135
                },
                {
                    "sinsid": "d8bebd4e-e073-43d6-8b78-21740f69e388",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -480.135
                },
                {
                    "sinsid": "da07432c-b037-43e0-a895-9ca385d6c5a8",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "EMIRLER1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -144.04500000000002
                },
                {
                    "sinsid": "dd31a7c8-cd8c-4bb1-bbb5-d2dc9aa219ca",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "dd51a93a-57d8-49f7-a872-58b708ccf770",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -308.008
                },
                {
                    "sinsid": "e07c7742-25df-4510-a7a7-610aff718882",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "e50c53dc-ded4-4ce0-a369-aef0f45b5af3",
                    "b1Name": "ADATOPRK",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:20:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "e791cef4-465d-49d8-b5fc-f7213fe56107",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "ebee59ea-62d4-4cb2-a14c-e7abea4f7e8d",
                    "b1Name": "GOKCEKAY",
                    "b2Name": "380",
                    "b3Name": "GOLBASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -517.8582576271187
                },
                {
                    "sinsid": "eda59a30-7091-4d64-8888-5322eb219d0b",
                    "b1Name": "KARGIHS",
                    "b2Name": "154",
                    "b3Name": "GURSOGUT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:20:00.000Z",
                    "AVG(maxValue)": -20.630277777777778
                },
                {
                    "sinsid": "eec14ca8-fcbb-4ee3-8e58-6f3a442aa550",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "YEDEK-3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "f7d1de39-fba8-4c60-b1af-3763f1a495d4",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:21:00.000Z",
                    "AVG(maxValue)": -219.52285714285716
                },
                {
                    "sinsid": "f9b2153e-cca9-4fc5-a8b9-341f22c2c7a2",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "SARIYAR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:38:00.000Z",
                    "AVG(maxValue)": -21.904285714285713
                },
                {
                    "sinsid": "fadb28db-0f04-43a7-8e62-4b223ccf43dc",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "swYEDTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "fb896e67-e5d2-47db-a01c-9575c67d17c1",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "G.KAYA-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "fbdb8c3f-6588-447c-b3b9-89a4de6b3664",
                    "b1Name": "BILKENTG",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T09:55:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "2ba1f424-0765-4c27-bd43-eb34e93065e8",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -82.49771159874608
                },
                {
                    "sinsid": "3ffbe598-8d3e-4fed-a316-325ce5b76aac",
                    "b1Name": "K.EREGLI",
                    "b2Name": "400",
                    "b3Name": "ADA-SEYD",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -43.781493506493504
                },
                {
                    "sinsid": "419cb7cc-247e-4466-a0c5-85e69979b0aa",
                    "b1Name": "CAMLICAH",
                    "b2Name": "154",
                    "b3Name": "swTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -27.723848396501456
                },
                {
                    "sinsid": "48bfe37a-5fee-4469-bb34-1ff2c35faf8c",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.025366726296959
                },
                {
                    "sinsid": "5301ae13-b799-4229-93e2-0f7d3febea23",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -24.732995169082127
                },
                {
                    "sinsid": "76abfc04-665c-4b3a-a85d-18cbadc4d8a3",
                    "b1Name": "CAMLICAH",
                    "b2Name": "154",
                    "b3Name": "swTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -27.765763157894735
                },
                {
                    "sinsid": "7fc03334-63b4-46e3-a862-494f60fb7a48",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -12.006318681318682
                },
                {
                    "sinsid": "b19678ea-4f76-4cbc-b3cc-3297ad627ce9",
                    "b1Name": "CAMLICAH",
                    "b2Name": "154",
                    "b3Name": "swTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -26.668037634408602
                },
                {
                    "sinsid": "31461d1e-508c-4def-ad8d-5ecd65fddcaa",
                    "b1Name": "YAYSUNGE",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T17:39:00.000Z",
                    "AVG(maxValue)": -1.180473372781065
                },
                {
                    "sinsid": "deaffdb3-5c6c-47e0-9b6a-a949e669e31e",
                    "b1Name": "YAYSUNGE",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T17:38:00.000Z",
                    "AVG(maxValue)": -1.3408333333333333
                },
                {
                    "sinsid": "76be9275-161a-41df-bcec-2092cbe97520",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -17.637773995915587
                },
                {
                    "sinsid": "69791b20-585e-40eb-ac4a-b43e513233da",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swSUTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T20:21:00.000Z",
                    "AVG(maxValue)": -0.064
                },
                {
                    "sinsid": "587737b4-8096-4911-adf3-3871a6a20cd2",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:41:00.000Z",
                    "AVG(maxValue)": -4.7495199999999995
                },
                {
                    "sinsid": "88ae4ec7-20cc-4995-b1cd-152001ffbe07",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "swTR-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:47:00.000Z",
                    "AVG(maxValue)": -21.73936170212766
                },
                {
                    "sinsid": "8343ab0d-cd5b-4a30-bb8e-9767fa108c1d",
                    "b1Name": "YOZGAT",
                    "b2Name": "154",
                    "b3Name": "BOZOK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.019468664850134
                },
                {
                    "sinsid": "8d3661d5-0749-4d88-94d9-efa84fa24178",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "AVANOS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -0.47022393282015384
                },
                {
                    "sinsid": "dbbcbec0-2d26-4c32-9ed3-2bb6a2f2cec2",
                    "b1Name": "YOZGAT",
                    "b2Name": "154",
                    "b3Name": "BOZOK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -34.809469026548676
                },
                {
                    "sinsid": "878de531-229a-433b-a6fd-756ab32adcb0",
                    "b1Name": "SARIYAR",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:10:00.000Z",
                    "AVG(maxValue)": -0.16
                },
                {
                    "sinsid": "33d877d5-ce4e-4176-a3e0-f4e1b8d7b5f0",
                    "b1Name": "PETLAS",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -51.50118707738542
                },
                {
                    "sinsid": "a161af43-7e4a-430a-9a08-b994cb0e058d",
                    "b1Name": "KULU",
                    "b2Name": "154",
                    "b3Name": "KIZILIRM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -39.36787755102041
                },
                {
                    "sinsid": "de3354f1-f427-4adb-99c9-5fc97eca7030",
                    "b1Name": "TAKSAN",
                    "b2Name": "154",
                    "b3Name": "CINKUR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:29:00.000Z",
                    "AVG(maxValue)": -0.24315068493150693
                },
                {
                    "sinsid": "9ad38e04-9655-4862-b838-6d8160cdaad1",
                    "b1Name": "KEPEZKAY",
                    "b2Name": "154",
                    "b3Name": "KEPEZHES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:44:00.000Z",
                    "AVG(maxValue)": -15.641405082212257
                },
                {
                    "sinsid": "f8aff3fb-57b2-446a-8a24-aca17de206e1",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "ERYAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.556548672566368
                },
                {
                    "sinsid": "92ceb326-6f30-4730-9310-dc3fa4dbb5c0",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "sOTR-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.88078284547311
                },
                {
                    "sinsid": "aa02ca1b-e4da-4f63-a781-7af0d22cc8c2",
                    "b1Name": "CIGDEM",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.142176870748298
                },
                {
                    "sinsid": "d296fc33-e633-4e90-b078-6d426017e275",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "sOTR-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.88078284547311
                },
                {
                    "sinsid": "ec3f61c7-6cb2-469c-ad0a-5a34e37dd907",
                    "b1Name": "KIRDEMIR",
                    "b2Name": "154",
                    "b3Name": "HACILAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.95007457121551
                },
                {
                    "sinsid": "0228b255-d3fc-4808-bd05-a3bb0c742d96",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "URGUP2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.35074931880109
                },
                {
                    "sinsid": "921e3feb-a969-42d0-bb6c-a985ebfa0197",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "swGTR3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.744496551724138
                },
                {
                    "sinsid": "7d9d71ec-d4b6-42d6-ad74-13cd06c07509",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -71.73464406779661
                },
                {
                    "sinsid": "95f024c2-bec9-415e-8d86-4903871383ed",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -71.73464406779661
                },
                {
                    "sinsid": "16153966-ca85-4103-b086-0e631e48ee4a",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -43.76110959836623
                },
                {
                    "sinsid": "a188ae2c-51ec-4a87-82bd-65364cf60f2e",
                    "b1Name": "ERENKOY",
                    "b2Name": "154",
                    "b3Name": "MERAMGIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -12.796591683708247
                },
                {
                    "sinsid": "7d88f129-c757-4ef9-a959-1f6d8ed017d3",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "swGTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -112.30208623087623
                },
                {
                    "sinsid": "9c90613c-ea5b-4bac-b4a5-1421304537e5",
                    "b1Name": "UZAYOSB",
                    "b2Name": "154",
                    "b3Name": "KAZAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.72540632054176
                },
                {
                    "sinsid": "184f4c2c-c54a-489b-8986-4d4ec16f1874",
                    "b1Name": "GUNEYSNR",
                    "b2Name": "154",
                    "b3Name": "MAVIHES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.277413972888426
                },
                {
                    "sinsid": "b3eb4f2b-93ef-488c-8be8-d9d914114fc0",
                    "b1Name": "ORTAKOY",
                    "b2Name": "154",
                    "b3Name": "TUMOSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -19.972009569377988
                },
                {
                    "sinsid": "c215304b-739f-417b-9918-42ecc0b21ae0",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -40.153732590529245
                },
                {
                    "sinsid": "1509ee9a-550c-4461-b18d-f4bd91482503",
                    "b1Name": "KAYACIK",
                    "b2Name": "154",
                    "b3Name": "KARATAY1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -16.927612732095486
                },
                {
                    "sinsid": "91bd5d9e-a7e9-4e63-87d9-d9b3b314f1ff",
                    "b1Name": "HACILAR",
                    "b2Name": "154",
                    "b3Name": "KAPULUKA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:36:00.000Z",
                    "AVG(maxValue)": -6.414157303370787
                },
                {
                    "sinsid": "f9fd468e-f96d-4ebf-bad2-b64ac92f59c8",
                    "b1Name": "EMIRLER",
                    "b2Name": "154",
                    "b3Name": "GOLBASI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:23:00.000Z",
                    "AVG(maxValue)": -1.25
                },
                {
                    "sinsid": "874796a7-2e8f-456b-8613-70141a30abba",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "ANKDG-ST",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T20:29:00.000Z",
                    "AVG(maxValue)": -1.56
                },
                {
                    "sinsid": "b6a23955-c263-4245-80e4-5f4b1637439c",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "ANKDG-G2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:09:00.000Z",
                    "AVG(maxValue)": -1.5747037701974869
                },
                {
                    "sinsid": "5db01c3c-01c2-4749-910b-1ecb9096411a",
                    "b1Name": "KAYACIK",
                    "b2Name": "154",
                    "b3Name": "KARATAY2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -17.236565874730022
                },
                {
                    "sinsid": "a0f0bcbd-f5f6-42ba-9ca1-461b8bcd91e8",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T11:37:00.000Z",
                    "AVG(maxValue)": -1.61
                },
                {
                    "sinsid": "72f86d49-58c0-4956-944a-3ba528a3d07b",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.362544080604533
                },
                {
                    "sinsid": "9daa9622-0dcc-42b2-af3b-afb27245abec",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.362544080604534
                },
                {
                    "sinsid": "59d6d7e0-49c8-4893-a0d5-2d82ce985a00",
                    "b1Name": "DAGYAKA",
                    "b2Name": "154",
                    "b3Name": "BAGLUM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -19.05890134529148
                },
                {
                    "sinsid": "2d5107b8-9dc7-41af-b852-5b3a3e7b0448",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -16.15282800815772
                },
                {
                    "sinsid": "6a56ca7b-4e22-48fe-83b1-b5eb4fc1d73a",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -16.15036005434783
                },
                {
                    "sinsid": "3862e5fc-a2f3-4f6c-ae89-fa1d88cba6b1",
                    "b1Name": "AKYEL-2",
                    "b2Name": "154",
                    "b3Name": "swTR-C",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -8.156034129692832
                },
                {
                    "sinsid": "87a18967-ed24-4996-93ed-ff1c7f884d69",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.994783180026282
                },
                {
                    "sinsid": "d1c7f9a4-f4e0-4de9-bddb-b659c55f6c83",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.99478318002628
                },
                {
                    "sinsid": "6c629b49-bd8f-477b-86a5-ac2d1f157b6b",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "KAZANDGK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.142607215793056
                },
                {
                    "sinsid": "6d0dd116-bcab-4573-a260-0c620ee468ba",
                    "b1Name": "SENDIRMK",
                    "b2Name": "154",
                    "b3Name": "OKSUTMDN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -53.79043537414966
                },
                {
                    "sinsid": "aea3006d-169c-41ce-8628-b0be975778ce",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.86149558123726
                },
                {
                    "sinsid": "2eb76242-a671-4cc8-8ed4-e365a35fd558",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -27.70425661914461
                },
                {
                    "sinsid": "b06c1431-90ac-43a5-9a83-918e1129f76e",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -22.72518891687657
                },
                {
                    "sinsid": "8938cfb0-4332-4587-ade4-76d5f3af0a9c",
                    "b1Name": "UZAYOSB",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -21.58110599078341
                },
                {
                    "sinsid": "e1de9eec-c369-49e0-8783-708f802fb767",
                    "b1Name": "HACILAR",
                    "b2Name": "154",
                    "b3Name": "ATAKALE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -48.1928231292517
                },
                {
                    "sinsid": "a2c8c9a2-7ce0-43dc-a0a0-caebca817caa",
                    "b1Name": "KUTUKLU",
                    "b2Name": "154",
                    "b3Name": "ORTAKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -9.98542291950887
                },
                {
                    "sinsid": "3f09cdcd-adb8-493d-8ecf-21c89d3f5e91",
                    "b1Name": "KALABA",
                    "b2Name": "154",
                    "b3Name": "URGUP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -19.369764705882353
                },
                {
                    "sinsid": "d0437626-8af3-45ca-bd96-338268ae753b",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -32.305961930659414
                },
                {
                    "sinsid": "2bf5b4d7-820c-47a3-a5ef-2f3fbe91e59c",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.989434954007884
                },
                {
                    "sinsid": "5da26dd9-6200-4b55-975e-1c88efc24e45",
                    "b1Name": "AKYURT",
                    "b2Name": "154",
                    "b3Name": "KALECIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -15.117388235294117
                },
                {
                    "sinsid": "6daad511-95a3-42e8-bfe6-cb3141a2520b",
                    "b1Name": "OKSUTTM",
                    "b2Name": "154",
                    "b3Name": "YAHYARBE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -61.679572573463936
                },
                {
                    "sinsid": "c1a72474-0193-4b43-98b1-e01d46da9a29",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.564771953710004
                },
                {
                    "sinsid": "c85d819f-0237-465c-8d48-91cc0a3330ae",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.564751531654185
                },
                {
                    "sinsid": "00b3785a-fee0-46ff-b9fd-11f273011bc6",
                    "b1Name": "BALGAT",
                    "b2Name": "154",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -24.217338325391417
                },
                {
                    "sinsid": "1da9aa8d-a26c-482e-ad99-1ee9019c3fc3",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "KARAPINA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -17.578208802456498
                },
                {
                    "sinsid": "7f6fe720-6e2e-47b1-8f55-205c176462ad",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "CAMLICA1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -40.2122380952381
                },
                {
                    "sinsid": "648e94d0-0439-4493-92b4-c52b7c5f8146",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "AKSRYOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.555303340149965
                },
                {
                    "sinsid": "b7709e26-2dae-49b4-8856-279795e60d35",
                    "b1Name": "ESENBOGA",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.613798767967147
                },
                {
                    "sinsid": "d41c7fc4-ee3c-4b3f-ab17-f58793f47f0c",
                    "b1Name": "KARAMANR",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.473942122186497
                },
                {
                    "sinsid": "ed482a3a-e4bd-4728-97f6-1d63f0e04f8c",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "KARAMANR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.814546075085328
                },
                {
                    "sinsid": "3b99f063-0071-455e-b035-1fa31c41e431",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLICAG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.636089613034624
                },
                {
                    "sinsid": "7b85588b-9582-44a2-82ba-4cc71affcd03",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.291034013605437
                },
                {
                    "sinsid": "a169258f-b846-454f-a6fb-aae7911578d9",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.292709326072153
                },
                {
                    "sinsid": "7a16a290-8642-4911-8a79-a270d48e0dcc",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": -6.83
                },
                {
                    "sinsid": "eb67e5a2-4e7b-4ff6-bfd2-7272d4e79288",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.792321307011573
                },
                {
                    "sinsid": "45655c46-2d9f-4a3b-9b0b-ee470a99b238",
                    "b1Name": "KAYSERI1",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.28093877551021
                },
                {
                    "sinsid": "bffb2054-4b36-41dc-821c-be9477073204",
                    "b1Name": "KARMNBES",
                    "b2Name": "154",
                    "b3Name": "KARAMANO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:40:00.000Z",
                    "AVG(maxValue)": -32.872058823529414
                },
                {
                    "sinsid": "2e951cc7-2098-4a8f-8a07-039fdf4affe0",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.66313524590164
                },
                {
                    "sinsid": "f87655d3-1c53-417d-9e63-ab529fd54ded",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.66201365187713
                },
                {
                    "sinsid": "3f414930-c159-467a-b017-e2c8e0471e05",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -37.769640434192674
                },
                {
                    "sinsid": "aca9b6ac-ca71-42c3-90d9-571ede93478e",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -57.05653767820774
                },
                {
                    "sinsid": "cb556423-87f5-4bb7-891f-436e886f00f9",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -33.68835486063902
                },
                {
                    "sinsid": "98739da5-5f69-41f0-bb89-99cd5cfda82d",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "ERCIYESR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -57.69847398030943
                },
                {
                    "sinsid": "d84e984d-3784-4f61-8aeb-18843e081187",
                    "b1Name": "BASTAS",
                    "b2Name": "154",
                    "b3Name": "KAYAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -42.82204761904762
                },
                {
                    "sinsid": "e0497c90-a4a4-4a98-9c2c-1702a0e87c3f",
                    "b1Name": "TALAS",
                    "b2Name": "154",
                    "b3Name": "KAYS_KP2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -19.483826405867973
                },
                {
                    "sinsid": "a6523df2-4845-4b71-8bed-6f0b1b8d76f9",
                    "b1Name": "BOROSB",
                    "b2Name": "154",
                    "b3Name": "G4_BOR-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -25.32770767613039
                },
                {
                    "sinsid": "2a74ec7d-c294-48e8-8bb2-34454e557d95",
                    "b1Name": "CIHANBEY",
                    "b2Name": "154",
                    "b3Name": "ALTNEKIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -34.02547619047619
                },
                {
                    "sinsid": "52008e65-2738-4721-b50f-720446565ae1",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -37.41664179104477
                },
                {
                    "sinsid": "faef8388-46f6-4766-b8e3-f52a72fbb795",
                    "b1Name": "TALAS",
                    "b2Name": "154",
                    "b3Name": "KAYS_KP1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.21052703627652
                },
                {
                    "sinsid": "ccb9020c-0ea5-4365-ad77-f7a021be2308",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -63.12949625595643
                },
                {
                    "sinsid": "d92cd58d-fc73-4c20-8382-72c5ab718cce",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "CAMLICA1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.619922535211266
                },
                {
                    "sinsid": "619d0180-93e6-4539-9fbd-a5cc3622966f",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:05:00.000Z",
                    "AVG(maxValue)": -21.136470588235294
                },
                {
                    "sinsid": "11e03afc-3d75-4029-ac2c-bac2ab1782b7",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "KAYACIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.556593707250343
                },
                {
                    "sinsid": "fafe93b5-c069-4096-8f97-566531fae4cb",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "ANKAR2-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -30.661299319727892
                },
                {
                    "sinsid": "ca0a8aa6-30e6-4a63-8fcc-65f1ea2fb522",
                    "b1Name": "TUZGOLGC",
                    "b2Name": "154",
                    "b3Name": "ESMEKAYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:41:00.000Z",
                    "AVG(maxValue)": -15.823319283456264
                },
                {
                    "sinsid": "c9d382d1-f8f3-4233-a1d6-76f72e1cdb6d",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "KIRSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -46.38641689373298
                },
                {
                    "sinsid": "990f41c7-725f-4625-a1de-98c499d29d70",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -36.58867847411444
                },
                {
                    "sinsid": "bad5a267-7788-4854-b828-603bc8607cf8",
                    "b1Name": "ESENBOGA",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.122307692307686
                },
                {
                    "sinsid": "95c5530d-a2a4-40b8-9de4-e6990879c5ed",
                    "b1Name": "EMIRLER",
                    "b2Name": "154",
                    "b3Name": "KULU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -54.81031702274293
                },
                {
                    "sinsid": "3e5a9171-94d5-4bf2-8793-230ed4f8ff27",
                    "b1Name": "HASKOY",
                    "b2Name": "154",
                    "b3Name": "MAMAK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -36.31102040816326
                },
                {
                    "sinsid": "0f545cf8-98a0-489c-9786-c1f8ee9e6c33",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "KARGIHES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T20:34:00.000Z",
                    "AVG(maxValue)": -74.90466666666667
                },
                {
                    "sinsid": "070b6362-ad41-46f2-9a99-bfab98091062",
                    "b1Name": "HADIM",
                    "b2Name": "154",
                    "b3Name": "KEPEZKAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -54.23524804177547
                },
                {
                    "sinsid": "82012318-9b93-4e5c-9c29-d9607b83d26d",
                    "b1Name": "INCEK",
                    "b2Name": "154",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -39.63470046082949
                },
                {
                    "sinsid": "97adb5ba-13ad-4c3c-97cb-d02dd34d25cb",
                    "b1Name": "BOR",
                    "b2Name": "154",
                    "b3Name": "TOROSLAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -64.03884353741495
                },
                {
                    "sinsid": "1ef7ac1f-566f-413e-a65f-d3ee8e9e6c54",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "KAZANDG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -24.048008157715838
                },
                {
                    "sinsid": "b7a9d149-1993-4ebd-9508-7db25f2729db",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.70060585432266
                },
                {
                    "sinsid": "e04c4190-72ee-43ac-88a5-e27d2d866a9a",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -50.882977566281454
                },
                {
                    "sinsid": "0e052abc-3508-4942-bfc6-a2257ca3472a",
                    "b1Name": "ALTINEKN",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -36.975102040816324
                },
                {
                    "sinsid": "3c224e88-6952-4236-8700-5ba238495dd0",
                    "b1Name": "OVACIK",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.99505384615385
                },
                {
                    "sinsid": "183e24ee-2fc9-43cc-8279-e67d48880d04",
                    "b1Name": "KIRSEHIR",
                    "b2Name": "154",
                    "b3Name": "PETLAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -45.62365777080062
                },
                {
                    "sinsid": "fb8cc1a3-8b89-4fac-a5b1-0e19aea734e0",
                    "b1Name": "GUNEYSNR",
                    "b2Name": "154",
                    "b3Name": "HADIM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -57.69625766871166
                },
                {
                    "sinsid": "874ebb8c-e3eb-4cd1-b512-c318ef8d1281",
                    "b1Name": "OVACIK",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -32.6807634164777
                },
                {
                    "sinsid": "74665387-d1c4-48aa-8324-df15ed35ff9d",
                    "b1Name": "TEKSINGE",
                    "b2Name": "154",
                    "b3Name": "AKYELRES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -55.912501704158146
                },
                {
                    "sinsid": "1b1ce649-2a80-4ae3-ab45-b50a8216a40d",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "KAYSER2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -39.465833900612665
                },
                {
                    "sinsid": "d98c5c93-dc6c-499f-80ce-0ea0da341db6",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "ARDICLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -51.04571428571429
                },
                {
                    "sinsid": "c326c55f-a7c8-43fa-b461-72004bef4045",
                    "b1Name": "KARAMANO",
                    "b2Name": "154",
                    "b3Name": "TEKSINGE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -57.52238225255973
                },
                {
                    "sinsid": "0108b0d5-c97a-4163-b8da-c57716f06a83",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "CINKUR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -62.03054347826088
                },
                {
                    "sinsid": "3771a174-2d4e-4a07-9668-12d6bc262ebe",
                    "b1Name": "CUMRA",
                    "b2Name": "154",
                    "b3Name": "GUNEYSIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -53.67134470989761
                },
                {
                    "sinsid": "6d9c2997-2dbb-4059-b0b0-4d78d77fc11c",
                    "b1Name": "KONYACIM",
                    "b2Name": "154",
                    "b3Name": "YAZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -24.472534153005466
                },
                {
                    "sinsid": "824b9bb1-d50a-43a9-8f22-dd4270331daf",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -75.66720298710116
                },
                {
                    "sinsid": "d76a8341-a4ee-460c-8012-7289e954a749",
                    "b1Name": "MERAMGIS",
                    "b2Name": "154",
                    "b3Name": "ALAKOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -33.39453125000001
                },
                {
                    "sinsid": "203725e2-8d63-4eaa-92cd-219c48583b6c",
                    "b1Name": "BALGAT",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -34.61379850238257
                },
                {
                    "sinsid": "05e66a74-3d94-46e3-93fa-d1348f1fbecc",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -67.70214965986395
                },
                {
                    "sinsid": "dad4abd5-5634-48cc-ab0e-922c09a32004",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -67.69706521739131
                },
                {
                    "sinsid": "5a643cab-236e-4e34-8bf4-aae7948d1166",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "TEMELLI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -54.226730115567634
                },
                {
                    "sinsid": "132bae33-8983-44e8-a8d0-dc7746fb8c77",
                    "b1Name": "KARMNBES",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -31.348992857142854
                },
                {
                    "sinsid": "ff93e4c2-c041-40cd-8cd4-2256eb6dc83a",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "MACUNKO2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -31.49341145833333
                },
                {
                    "sinsid": "afb04ab4-0d95-49c7-924d-6d37b7c3906f",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "HASKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:07:00.000Z",
                    "AVG(maxValue)": -39.925999999999995
                },
                {
                    "sinsid": "5c4a56b5-41e1-4693-a497-7a0b630dc09b",
                    "b1Name": "BUSAN",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -45.30712338104976
                },
                {
                    "sinsid": "8a521155-6d5d-46ff-929f-81a7028da385",
                    "b1Name": "KAYSERI1",
                    "b2Name": "154",
                    "b3Name": "KAYSERI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -39.77625938566553
                },
                {
                    "sinsid": "6278526d-951f-42ef-a5f6-3b5f7f3d196f",
                    "b1Name": "BALGAT",
                    "b2Name": "154",
                    "b3Name": "MALTEPE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -49.90764785859959
                },
                {
                    "sinsid": "40a46a78-d796-4360-98c8-f58cfa60bd36",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -65.57213645761544
                },
                {
                    "sinsid": "ba422e9e-b552-4bb0-b874-5ced8f8c4030",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "BOROSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -45.668027210884354
                },
                {
                    "sinsid": "31824126-11c6-4e15-a322-af89bb4b3a30",
                    "b1Name": "ERENKOY",
                    "b2Name": "154",
                    "b3Name": "SELCUKLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -44.780047716428086
                },
                {
                    "sinsid": "6f98c2f9-6bbf-40ab-8510-40167a68e99c",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "GEZENDE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -45.17761255115962
                },
                {
                    "sinsid": "2b0d7ddd-3706-4d89-a167-6753568da96e",
                    "b1Name": "SIZIR",
                    "b2Name": "154",
                    "b3Name": "SARKISLA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -42.34058583106267
                },
                {
                    "sinsid": "c7361b8b-f46b-489b-94fa-178974ca3f02",
                    "b1Name": "NIGDE",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -65.47562882392931
                },
                {
                    "sinsid": "f177430b-cd7b-4880-9614-d775a267cb01",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "MUTRES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -52.699624829467936
                },
                {
                    "sinsid": "24edfdae-73c8-4a9c-b1c3-ac314a4dc0d4",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "sOTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -51.32100748808713
                },
                {
                    "sinsid": "f90e1ecd-9e24-4e77-aa96-eac4a52b0c93",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "sOTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -51.32007488087133
                },
                {
                    "sinsid": "8fea57ce-946c-447b-9dce-b1ca0baf4c04",
                    "b1Name": "ERKILET",
                    "b2Name": "154",
                    "b3Name": "KAYSERI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -51.60840027229407
                },
                {
                    "sinsid": "a3d02a48-9657-4372-b6b5-0c1f4b45535a",
                    "b1Name": "KAZAN",
                    "b2Name": "154",
                    "b3Name": "KAZANDG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -39.694908700322244
                },
                {
                    "sinsid": "80d5594f-b9b2-4a5a-9dea-a0d0328ea88c",
                    "b1Name": "ERYAMAN",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -66.53120923913043
                },
                {
                    "sinsid": "e161309a-e3a4-4d76-bb71-394082c792cb",
                    "b1Name": "ETI-SODA",
                    "b2Name": "154",
                    "b3Name": "BEYPAZAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -48.085288461538454
                },
                {
                    "sinsid": "c5cbc7a4-96fe-4258-b2ac-e626d612a3c0",
                    "b1Name": "AKSRYOSB",
                    "b2Name": "154",
                    "b3Name": "DERINKUY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -67.11721957851802
                },
                {
                    "sinsid": "c06515d7-6141-45cb-85cf-11da62b9fe80",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "SIZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.095772634445204
                },
                {
                    "sinsid": "44deb723-0e5e-466c-b21d-dd850af07751",
                    "b1Name": "BEYPAZAR",
                    "b2Name": "154",
                    "b3Name": "OYAK1GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -68.53394321766561
                },
                {
                    "sinsid": "151f9a67-9196-4488-b063-eba4ea41bbc4",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "KARAMANB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -64.41753237900477
                },
                {
                    "sinsid": "d9533788-8fe1-4fbf-abcf-ff45ef4ca5e3",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swGTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -40.05259536784742
                },
                {
                    "sinsid": "17bed5dd-a29c-4df2-a549-dad0764400b0",
                    "b1Name": "ALAKOVA",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -61.36444822888284
                },
                {
                    "sinsid": "29abcd2d-f1f7-492e-ae51-909fcf3eba98",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "CUMRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -97.03930427493715
                },
                {
                    "sinsid": "6aacbfd4-c849-4e9b-b3f1-348a33ad56bd",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAPAS-H3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -58.53096928327645
                },
                {
                    "sinsid": "037b899d-594c-4207-80ec-723b5eb4b532",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAPAS-H1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.41125850340135
                },
                {
                    "sinsid": "893e64ae-e5ab-40b1-9b7e-455d31b94cc2",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "sOTR4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -65.74030612244898
                },
                {
                    "sinsid": "f9ac5848-8282-4ac7-b93d-33be3f342641",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "sOTR3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -65.74756296800545
                },
                {
                    "sinsid": "57fdc314-f966-4d9f-a269-de5388863215",
                    "b1Name": "CUMRA",
                    "b2Name": "154",
                    "b3Name": "DIANAGES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -84.79517358747447
                },
                {
                    "sinsid": "215afd26-360e-456a-b15f-1dbdde991b1c",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAPAS-H2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -60.67080436264486
                },
                {
                    "sinsid": "880116b4-4b01-43cf-a09b-286b6ebab445",
                    "b1Name": "BAGLICAG",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:40:00.000Z",
                    "AVG(maxValue)": -56.423846153846156
                },
                {
                    "sinsid": "41c6c2cb-64ea-42a6-94ed-f18c44cdc04d",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "KARAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -87.44570247933883
                },
                {
                    "sinsid": "8aa60543-031e-4279-b7a6-dd2110d2620e",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "ANKARA2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -55.79222826086957
                },
                {
                    "sinsid": "0a12cbd9-b16d-4974-a486-6bae07996382",
                    "b1Name": "SELCUKLU",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -67.60590320381732
                },
                {
                    "sinsid": "56a20782-c553-4afe-8448-25c7aa5d2053",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLUM1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.62265848670757
                },
                {
                    "sinsid": "c977bea4-20e5-4a41-9a75-5e61cae11209",
                    "b1Name": "MAMAK",
                    "b2Name": "154",
                    "b3Name": "KAYAS-3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.268944141689374
                },
                {
                    "sinsid": "7ed90811-ca99-498d-a02d-630ca4d984fd",
                    "b1Name": "YAZIR",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -62.482050408719346
                },
                {
                    "sinsid": "1b77e196-18fa-46b1-be1d-d1ff3b0514a5",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLUM2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -70.32394145677331
                },
                {
                    "sinsid": "071d0d66-3fb1-468f-8390-7573636745a5",
                    "b1Name": "HASKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -72.48329608938548
                },
                {
                    "sinsid": "a0822b11-39b7-49e5-9067-fedb20db1252",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "swOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -95.61678115799803
                },
                {
                    "sinsid": "a4cab8a8-384a-45f2-bd73-cabd0499e8a0",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "BAGLARRS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -112.82221311475409
                },
                {
                    "sinsid": "11563972-9534-4183-8f5f-ba633d23b375",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -81.36543847722639
                },
                {
                    "sinsid": "abc4e632-af36-46f4-9e62-560039922e97",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -81.36570360299118
                },
                {
                    "sinsid": "ac436d98-714b-4eb7-a877-c3800e18f3c2",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -102.64048332198776
                },
                {
                    "sinsid": "1d630793-d2bd-4fba-bfc4-3d20509cf606",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -103.72608310626703
                },
                {
                    "sinsid": "5e6bac62-25ff-4481-86f7-f2c715d6a25a",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -103.74802999318335
                },
                {
                    "sinsid": "731283f3-8779-47ae-aa7e-712138d28634",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -91.90584918478261
                },
                {
                    "sinsid": "9f071bb5-18df-4ed5-a16b-afb6ce647868",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -91.89095173351461
                },
                {
                    "sinsid": "867043af-570d-43da-a48d-89a49f35f1fe",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "KAYAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -91.42989276139411
                },
                {
                    "sinsid": "396ab932-835c-4534-9117-ec600b4db61c",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -98.99453433038748
                },
                {
                    "sinsid": "5dcd76f7-db5c-465f-b25a-7a0be8b72550",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -98.97740136054422
                },
                {
                    "sinsid": "afadf5a2-364a-459e-8f9e-94bc2d1ae274",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -113.80513966480444
                },
                {
                    "sinsid": "16b76a2c-5ba4-463c-8eb6-649374757232",
                    "b1Name": "YILDIZ",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -91.19733832539143
                },
                {
                    "sinsid": "3bf2ad88-58ed-4018-ac79-61838aad49db",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -101.01705163043479
                },
                {
                    "sinsid": "673c05e8-722d-45d0-a16e-6d2a4a1ebdcf",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -101.01705163043479
                },
                {
                    "sinsid": "20080de2-ebe4-4d04-be77-48b394292077",
                    "b1Name": "IMRAH101",
                    "b2Name": "154",
                    "b3Name": "KAYAS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -92.8437747440273
                },
                {
                    "sinsid": "56cbe1e3-b6f0-416a-aac8-08924361f354",
                    "b1Name": "IMRAHOR",
                    "b2Name": "154",
                    "b3Name": "KAYAS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -92.84409556313993
                },
                {
                    "sinsid": "921de96a-fa4d-48f4-9bc9-9e518680ae55",
                    "b1Name": "KARATAY",
                    "b2Name": "380",
                    "b3Name": "K.PINARG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -263.8684273709484
                },
                {
                    "sinsid": "85069447-93f1-46be-9bcf-55bd5d3ecbfc",
                    "b1Name": "IMRAHOR",
                    "b2Name": "154",
                    "b3Name": "KAYAS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -114.62572305593453
                },
                {
                    "sinsid": "9a367f0a-023b-4c47-923d-dd7804576458",
                    "b1Name": "IMRAH101",
                    "b2Name": "154",
                    "b3Name": "KAYAS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -114.62581855388815
                },
                {
                    "sinsid": "848f8cbc-806a-47be-b071-ba5af9cc7af3",
                    "b1Name": "MALTEPE",
                    "b2Name": "154",
                    "b3Name": "AKKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -112.2612721088435
                },
                {
                    "sinsid": "bde71065-9e13-4d6b-8510-d32c9e885479",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -131.4804761904762
                },
                {
                    "sinsid": "0c7ac670-b3db-4a41-aea2-b5cbab38f81a",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "KIRIKKAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -151.42850340136053
                },
                {
                    "sinsid": "6f40e0d8-9060-4ca3-bd44-5fefb1f4b90f",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "KOZAN1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -213.9071768707483
                },
                {
                    "sinsid": "0daec74f-3a18-4364-bda9-db7b6437792d",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -111.40492727272728
                },
                {
                    "sinsid": "0dcb54d9-a7a9-40ee-8694-c2b911928071",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -111.42018214936249
                },
                {
                    "sinsid": "61a48f35-f77f-4191-8d6e-8d07e1fc9d01",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -111.82959810874704
                },
                {
                    "sinsid": "ca60fee0-5f20-4056-b9d8-1f351d93173b",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -111.82959810874704
                },
                {
                    "sinsid": "c00d01a1-2630-48f5-a318-4500a8befc6c",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "KOZAN2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -216.20991836734686
                },
                {
                    "sinsid": "a9b190a5-a0a6-471d-8f93-051e2aced9a1",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "swGTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -98.87544883303413
                },
                {
                    "sinsid": "7ee64927-e03f-42a8-9b27-e2e543a9531b",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "ELBISTAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -152.2164408725603
                },
                {
                    "sinsid": "7e2637c9-bb09-45d3-9e0a-31367ef1f923",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -116.52053254437871
                },
                {
                    "sinsid": "8633a881-32af-40a2-9272-b0eade436be8",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -116.52053254437871
                },
                {
                    "sinsid": "5bd2e197-a403-4c2c-92ea-a0823bbe4d70",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -116.49395604395606
                },
                {
                    "sinsid": "f2652f02-6290-4f9a-b63b-1ae49b81996e",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -116.49395604395606
                },
                {
                    "sinsid": "32000831-f18d-4fac-934d-b83d58e3a9f7",
                    "b1Name": "KONYAKZY",
                    "b2Name": "380",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -221.33029271613339
                },
                {
                    "sinsid": "39501565-2110-4fdc-a592-4c6d7877ff73",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -162.73216711956522
                },
                {
                    "sinsid": "42b84995-543a-4c25-93c0-078d4006bebf",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "KIRIKDG1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -179.88108747044916
                },
                {
                    "sinsid": "97a9bf21-cc7c-4eee-b9a5-e6b90df17af2",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "380",
                    "b3Name": "KIRIKDG1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -175.90037162162162
                },
                {
                    "sinsid": "9248e1dd-5ee5-46f7-b5c8-0902db5acdab",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "380",
                    "b3Name": "KIRIKDG2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -180.9840655737705
                },
                {
                    "sinsid": "b176765a-2d77-41ba-a6dc-04b60c2872ce",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "KIRIKDG2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -183.17331797235022
                },
                {
                    "sinsid": "54a5bb76-a643-43c2-99cb-38b9f9965171",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -207.40676650782848
                },
                {
                    "sinsid": "52248945-9685-4c26-a1a1-66c63f020719",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -183.83937457511894
                },
                {
                    "sinsid": "f8367f77-a5d2-40af-95ed-fe519c655c96",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "swGTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -137.03678383128295
                },
                {
                    "sinsid": "c1422600-10b8-4e65-a924-d6e856516864",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -202.01103260869567
                },
                {
                    "sinsid": "32510f50-b623-4e0d-874e-dbfb4a8461b8",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -223.61580406654346
                },
                {
                    "sinsid": "b3e5c3c5-a995-4679-840f-59d50437d428",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -223.65938534278962
                },
                {
                    "sinsid": "4978ac31-8673-425a-910a-eff223443523",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swGTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -191.77717791411044
                },
                {
                    "sinsid": "1b491843-61a4-4e98-bfea-b49ee73b8a28",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -233.51159463487338
                },
                {
                    "sinsid": "5e088af4-9dc2-4f41-b4d8-935961fa0f09",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -232.98710622710627
                },
                {
                    "sinsid": "3f84fa61-8f12-4fde-9d8f-b27ca57b56e9",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -231.92891836734694
                },
                {
                    "sinsid": "fb82c106-3d46-4314-a393-c60cd3687e75",
                    "b1Name": "BOZOKTM",
                    "b2Name": "380",
                    "b3Name": "RESADIYE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -408.00872427983546
                },
                {
                    "sinsid": "a6aed9fc-6229-442d-a889-d54fd4dd54d9",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "TUFANTES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -376.88529611980937
                },
                {
                    "sinsid": "314adf7b-ddbb-400b-bd3a-3e3ddf293f57",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -391.2099432221434
                },
                {
                    "sinsid": "a07864c8-8935-40b4-8c07-db0ef1507d96",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "ANKARA-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -515.7989154013017
                },
                {
                    "sinsid": "1665f084-81de-418c-ad22-29708aac5433",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "KAYABASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -558.574944267516
                },
                {
                    "sinsid": "e2ea0920-f2ad-45eb-aadd-b70d1168cfe0",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "GOKSUNK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -478.7447174948946
                },
                {
                    "sinsid": "a95265e7-80a2-43c1-b730-136b67d3aa6f",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "GOKSUNG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -486.4950101971447
                },
                {
                    "sinsid": "95963c3b-0f13-48c2-a368-0d045d37d93a",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "GOLBASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -517.6006548933038
                },
                {
                    "sinsid": "76eca8a5-2dc0-46a9-9bcb-61a2fb383b0d",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "KEBAN-2K",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -558.5365316205534
                },
                {
                    "sinsid": "13210e6a-a236-4a5e-a7ce-e7863946aa41",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "URGUP1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -598.7809228650137
                },
                {
                    "sinsid": "fb4a00fe-b41a-4323-bcb5-24e48bdabf83",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "URGUP2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -585.0189027777777
                },
                {
                    "sinsid": "0c5f0c91-d279-48b4-9fce-16babd4b30ae",
                    "b1Name": "URGUPTM",
                    "b2Name": "400",
                    "b3Name": "ELBISTAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -619.6411399317407
                },
                {
                    "sinsid": "f5795324-3d9a-4d05-bd5e-1abd8ee2d807",
                    "b1Name": "URGUPTM",
                    "b2Name": "400",
                    "b3Name": "COBANBEY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -684.3420081967212
                },
                {
                    "sinsid": "a8c26e66-c04f-48b6-8b10-5f032b1ac190",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -691.0947563486617
                },
                {
                    "sinsid": "6a3bb442-e105-48ff-812e-3137afbc41c4",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "YESILH-K",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -765.7429460013668
                },
                {
                    "sinsid": "eed09e0b-4cc9-4f8f-88df-37331c436282",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "YESILH-G",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -767.0987329700272
                }
            ],
            "result_format": "json",
            "applied_filters": [
                {
                    "column": "elementName"
                },
                {
                    "column": "b2Name"
                },
                {
                    "column": "tear"
                }
            ],
            "rejected_filters": []
        }
    ]
}


{
    "result": [
        {
            "cache_key": "14f3d1af98f23450c23bf188b5ceb1d4",
            "cached_dttm": "2026-04-19T20:56:22",
            "cache_timeout": 3600,
            "applied_template_filters": [],
            "annotation_data": {},
            "error": null,
            "is_cached": true,
            "query": "SELECT \"sinsid\" AS \"sinsid\",\n       \"b1Name\" AS \"b1Name\",\n       \"b2Name\" AS \"b2Name\",\n       \"b3Name\" AS \"b3Name\",\n       \"elementName\" AS \"elementName\",\n       max(\"__time\") AS \"MAX(__time)\",\n       AVG(\"maxValue\") AS \"AVG(maxValue)\"\nFROM \"druid\".\"teias-analog-aggregate\"\nWHERE \"__time\" >= '2026-04-18 23:56:17.000000'\n  AND \"__time\" < '2026-04-19 23:56:17.000000'\n  AND \"elementName\" = 'P'\n  AND \"b2Name\" IN ('400',\n                   '380',\n                   '420',\n                   '154')\n  AND \"tear\" IN ('Golbasi_YTM')\nGROUP BY \"sinsid\",\n         \"b1Name\",\n         \"b2Name\",\n         \"b3Name\",\n         \"elementName\"\nORDER BY max(\"maxValue\") DESC\nLIMIT 50000;\n\n",
            "status": "success",
            "stacktrace": null,
            "rowcount": 852,
            "from_dttm": 1776556656000.0,
            "to_dttm": 1776643056000.0,
            "label_map": {
                "sinsid": [
                    "sinsid"
                ],
                "b1Name": [
                    "b1Name"
                ],
                "b2Name": [
                    "b2Name"
                ],
                "b3Name": [
                    "b3Name"
                ],
                "elementName": [
                    "elementName"
                ],
                "MAX(__time)": [
                    "MAX(__time)"
                ],
                "AVG(maxValue)": [
                    "AVG(maxValue)"
                ]
            },
            "colnames": [
                "sinsid",
                "b1Name",
                "b2Name",
                "b3Name",
                "elementName",
                "MAX(__time)",
                "AVG(maxValue)"
            ],
            "indexnames": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18,
                19,
                20,
                21,
                22,
                23,
                24,
                25,
                26,
                27,
                28,
                29,
                30,
                31,
                32,
                33,
                34,
                35,
                36,
                37,
                38,
                39,
                40,
                41,
                42,
                43,
                44,
                45,
                46,
                47,
                48,
                49,
                50,
                51,
                52,
                53,
                54,
                55,
                56,
                57,
                58,
                59,
                60,
                61,
                62,
                63,
                64,
                65,
                66,
                67,
                68,
                69,
                70,
                71,
                72,
                73,
                74,
                75,
                76,
                77,
                78,
                79,
                80,
                81,
                82,
                83,
                84,
                85,
                86,
                87,
                88,
                89,
                90,
                91,
                92,
                93,
                94,
                95,
                96,
                97,
                98,
                99,
                100,
                101,
                102,
                103,
                104,
                105,
                106,
                107,
                108,
                109,
                110,
                111,
                112,
                113,
                114,
                115,
                116,
                117,
                118,
                119,
                120,
                121,
                122,
                123,
                124,
                125,
                126,
                127,
                128,
                129,
                130,
                131,
                132,
                133,
                134,
                135,
                136,
                137,
                138,
                139,
                140,
                141,
                142,
                143,
                144,
                145,
                146,
                147,
                148,
                149,
                150,
                151,
                152,
                153,
                154,
                155,
                156,
                157,
                158,
                159,
                160,
                161,
                162,
                163,
                164,
                165,
                166,
                167,
                168,
                169,
                170,
                171,
                172,
                173,
                174,
                175,
                176,
                177,
                178,
                179,
                180,
                181,
                182,
                183,
                184,
                185,
                186,
                187,
                188,
                189,
                190,
                191,
                192,
                193,
                194,
                195,
                196,
                197,
                198,
                199,
                200,
                201,
                202,
                203,
                204,
                205,
                206,
                207,
                208,
                209,
                210,
                211,
                212,
                213,
                214,
                215,
                216,
                217,
                218,
                219,
                220,
                221,
                222,
                223,
                224,
                225,
                226,
                227,
                228,
                229,
                230,
                231,
                232,
                233,
                234,
                235,
                236,
                237,
                238,
                239,
                240,
                241,
                242,
                243,
                244,
                245,
                246,
                247,
                248,
                249,
                250,
                251,
                252,
                253,
                254,
                255,
                256,
                257,
                258,
                259,
                260,
                261,
                262,
                263,
                264,
                265,
                266,
                267,
                268,
                269,
                270,
                271,
                272,
                273,
                274,
                275,
                276,
                277,
                278,
                279,
                280,
                281,
                282,
                283,
                284,
                285,
                286,
                287,
                288,
                289,
                290,
                291,
                292,
                293,
                294,
                295,
                296,
                297,
                298,
                299,
                300,
                301,
                302,
                303,
                304,
                305,
                306,
                307,
                308,
                309,
                310,
                311,
                312,
                313,
                314,
                315,
                316,
                317,
                318,
                319,
                320,
                321,
                322,
                323,
                324,
                325,
                326,
                327,
                328,
                329,
                330,
                331,
                332,
                333,
                334,
                335,
                336,
                337,
                338,
                339,
                340,
                341,
                342,
                343,
                344,
                345,
                346,
                347,
                348,
                349,
                350,
                351,
                352,
                353,
                354,
                355,
                356,
                357,
                358,
                359,
                360,
                361,
                362,
                363,
                364,
                365,
                366,
                367,
                368,
                369,
                370,
                371,
                372,
                373,
                374,
                375,
                376,
                377,
                378,
                379,
                380,
                381,
                382,
                383,
                384,
                385,
                386,
                387,
                388,
                389,
                390,
                391,
                392,
                393,
                394,
                395,
                396,
                397,
                398,
                399,
                400,
                401,
                402,
                403,
                404,
                405,
                406,
                407,
                408,
                409,
                410,
                411,
                412,
                413,
                414,
                415,
                416,
                417,
                418,
                419,
                420,
                421,
                422,
                423,
                424,
                425,
                426,
                427,
                428,
                429,
                430,
                431,
                432,
                433,
                434,
                435,
                436,
                437,
                438,
                439,
                440,
                441,
                442,
                443,
                444,
                445,
                446,
                447,
                448,
                449,
                450,
                451,
                452,
                453,
                454,
                455,
                456,
                457,
                458,
                459,
                460,
                461,
                462,
                463,
                464,
                465,
                466,
                467,
                468,
                469,
                470,
                471,
                472,
                473,
                474,
                475,
                476,
                477,
                478,
                479,
                480,
                481,
                482,
                483,
                484,
                485,
                486,
                487,
                488,
                489,
                490,
                491,
                492,
                493,
                494,
                495,
                496,
                497,
                498,
                499,
                500,
                501,
                502,
                503,
                504,
                505,
                506,
                507,
                508,
                509,
                510,
                511,
                512,
                513,
                514,
                515,
                516,
                517,
                518,
                519,
                520,
                521,
                522,
                523,
                524,
                525,
                526,
                527,
                528,
                529,
                530,
                531,
                532,
                533,
                534,
                535,
                536,
                537,
                538,
                539,
                540,
                541,
                542,
                543,
                544,
                545,
                546,
                547,
                548,
                549,
                550,
                551,
                552,
                553,
                554,
                555,
                556,
                557,
                558,
                559,
                560,
                561,
                562,
                563,
                564,
                565,
                566,
                567,
                568,
                569,
                570,
                571,
                572,
                573,
                574,
                575,
                576,
                577,
                578,
                579,
                580,
                581,
                582,
                583,
                584,
                585,
                586,
                587,
                588,
                589,
                590,
                591,
                592,
                593,
                594,
                595,
                596,
                597,
                598,
                599,
                600,
                601,
                602,
                603,
                604,
                605,
                606,
                607,
                608,
                609,
                610,
                611,
                612,
                613,
                614,
                615,
                616,
                617,
                618,
                619,
                620,
                621,
                622,
                623,
                624,
                625,
                626,
                627,
                628,
                629,
                630,
                631,
                632,
                633,
                634,
                635,
                636,
                637,
                638,
                639,
                640,
                641,
                642,
                643,
                644,
                645,
                646,
                647,
                648,
                649,
                650,
                651,
                652,
                653,
                654,
                655,
                656,
                657,
                658,
                659,
                660,
                661,
                662,
                663,
                664,
                665,
                666,
                667,
                668,
                669,
                670,
                671,
                672,
                673,
                674,
                675,
                676,
                677,
                678,
                679,
                680,
                681,
                682,
                683,
                684,
                685,
                686,
                687,
                688,
                689,
                690,
                691,
                692,
                693,
                694,
                695,
                696,
                697,
                698,
                699,
                700,
                701,
                702,
                703,
                704,
                705,
                706,
                707,
                708,
                709,
                710,
                711,
                712,
                713,
                714,
                715,
                716,
                717,
                718,
                719,
                720,
                721,
                722,
                723,
                724,
                725,
                726,
                727,
                728,
                729,
                730,
                731,
                732,
                733,
                734,
                735,
                736,
                737,
                738,
                739,
                740,
                741,
                742,
                743,
                744,
                745,
                746,
                747,
                748,
                749,
                750,
                751,
                752,
                753,
                754,
                755,
                756,
                757,
                758,
                759,
                760,
                761,
                762,
                763,
                764,
                765,
                766,
                767,
                768,
                769,
                770,
                771,
                772,
                773,
                774,
                775,
                776,
                777,
                778,
                779,
                780,
                781,
                782,
                783,
                784,
                785,
                786,
                787,
                788,
                789,
                790,
                791,
                792,
                793,
                794,
                795,
                796,
                797,
                798,
                799,
                800,
                801,
                802,
                803,
                804,
                805,
                806,
                807,
                808,
                809,
                810,
                811,
                812,
                813,
                814,
                815,
                816,
                817,
                818,
                819,
                820,
                821,
                822,
                823,
                824,
                825,
                826,
                827,
                828,
                829,
                830,
                831,
                832,
                833,
                834,
                835,
                836,
                837,
                838,
                839,
                840,
                841,
                842,
                843,
                844,
                845,
                846,
                847,
                848,
                849,
                850,
                851
            ],
            "coltypes": [
                1,
                1,
                1,
                1,
                1,
                1,
                0
            ],
            "data": [
                {
                    "sinsid": "64a14f61-8090-4eee-b371-8a7e89c7fa16",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "OSMANCA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 929.6776639344262
                },
                {
                    "sinsid": "a58ac8fc-5b4e-45af-8aac-1840ce2efa0a",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "GEBZE-DG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 949.4449999999999
                },
                {
                    "sinsid": "ff50afeb-aed7-4688-b07f-1d0414087907",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "ADA-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 813.8349035369775
                },
                {
                    "sinsid": "f74f5067-e2eb-4de6-85df-61723d02980f",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "AGACOR.K",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 820.7141020408163
                },
                {
                    "sinsid": "8eb54664-7d2d-4ede-a7e4-515e8ed3b231",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "AGACOR.G",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 811.3766734693877
                },
                {
                    "sinsid": "88d98ab0-c7c6-482a-85bf-f51801ac9d8b",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "ADAPAZAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 727.7411696306432
                },
                {
                    "sinsid": "ccefb2ce-6102-4ed1-8dc8-ab24d85d7f8d",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "YUNUSEMR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 708.9471108089733
                },
                {
                    "sinsid": "312b6d76-8e96-44e9-98e9-986a3b495d62",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "G.KAYA-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 530.6004548540394
                },
                {
                    "sinsid": "8e01efb1-3a41-4842-bddd-c1cbede5a301",
                    "b1Name": "URGUPTM",
                    "b2Name": "400",
                    "b3Name": "SINCAN1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 635.5768417462484
                },
                {
                    "sinsid": "575d5d0b-59cf-4994-bbd6-c3a56714d4e7",
                    "b1Name": "URGUPTM",
                    "b2Name": "400",
                    "b3Name": "SINCAN2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 619.7566712141883
                },
                {
                    "sinsid": "b50407e1-bc2d-4fb8-8535-f297415bbd7e",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 538.44576478586
                },
                {
                    "sinsid": "0f35280e-b0a5-47ad-a6c9-cfe1d8866d93",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 324.3512984364378
                },
                {
                    "sinsid": "ee95eda4-a026-4646-aa87-f05ef33d1dfd",
                    "b1Name": "GOKCEKAY",
                    "b2Name": "380",
                    "b3Name": "AKSAGOYN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 604.1415186440678
                },
                {
                    "sinsid": "5fd1911e-5ef8-49fa-9076-5bdfa194241e",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "SINCAN-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 554.6617267165193
                },
                {
                    "sinsid": "01996321-dd3b-4855-93d8-e8ac5765dd1c",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "ANKARA-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 244.2390006798096
                },
                {
                    "sinsid": "a9fe2bbb-d341-4f5a-9915-c081f4a95735",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "GOLBAS-G",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 552.7244057971013
                },
                {
                    "sinsid": "27190e4e-79a2-4526-9121-88a9b40c424b",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "GOLBAS-K",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 533.9498843537416
                },
                {
                    "sinsid": "d28a4615-c063-4c24-86af-86fedcf494e6",
                    "b1Name": "BOZOKTM",
                    "b2Name": "380",
                    "b3Name": "ICANADOL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 349.7779098360655
                },
                {
                    "sinsid": "d2813ebf-f6b0-424d-98d2-50c926aff5be",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "K.PINARG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 234.18896800000007
                },
                {
                    "sinsid": "8d432216-f1fe-4ea0-8701-565ae6df6d0f",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 276.33756887052346
                },
                {
                    "sinsid": "1b548d3c-3614-4ed0-b92d-bce43f1db5b4",
                    "b1Name": "KARATAY",
                    "b2Name": "380",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 218.62394380853277
                },
                {
                    "sinsid": "8a7f5dbf-ae05-4ed3-8c40-fe8526dc472e",
                    "b1Name": "KONYAKZY",
                    "b2Name": "380",
                    "b3Name": "AFYON-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 189.71763104152487
                },
                {
                    "sinsid": "147d5ba7-5e37-4b26-bb7b-58e2cc05fc94",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "AFYON-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.077000681663254
                },
                {
                    "sinsid": "2ee7de58-a1a4-4c21-8e5b-6046ebe89bcc",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "IGAGES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.166487406398915
                },
                {
                    "sinsid": "2b5cba2f-d35a-4499-82f7-d216f9d6bd0c",
                    "b1Name": "POLATCMT",
                    "b2Name": "154",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -5.8321414004078855
                },
                {
                    "sinsid": "fd027666-1f39-4780-bc1f-486aad687a27",
                    "b1Name": "GOKCEKAY",
                    "b2Name": "380",
                    "b3Name": "ESKISEH3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.39599322033898
                },
                {
                    "sinsid": "809e5f03-d036-4c57-8743-af8e3fb4bcf5",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "KAYAS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 188.54494994438267
                },
                {
                    "sinsid": "ed1a1ec7-82a1-4301-b68c-54f0a26e14f3",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -8.414737559645545
                },
                {
                    "sinsid": "32f0ead6-3ffc-423e-8b8a-7d2774429f38",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "KAYAS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 186.08628445424475
                },
                {
                    "sinsid": "6d272e1f-3b34-49c7-961c-d2a18eff136f",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "GOLBASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 137.78783618581906
                },
                {
                    "sinsid": "c8056eea-7049-410c-b0db-f0fb29a0a009",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "K.KALEDG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:17:00.000Z",
                    "AVG(maxValue)": 207.98315521628496
                },
                {
                    "sinsid": "322757c5-3c88-439f-b38a-9db32c9fa424",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:12:00.000Z",
                    "AVG(maxValue)": 105.12347600518807
                },
                {
                    "sinsid": "d6f7529b-302c-4830-a4d7-c3895e7c1ffa",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 140.59316793893132
                },
                {
                    "sinsid": "27e9d325-82e2-46ae-aba3-b52548b72e7f",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "TALAS1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 203.21785027472527
                },
                {
                    "sinsid": "876fc63c-9b45-4c1b-8524-7605ec665d98",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "TALAS2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 202.62459403192227
                },
                {
                    "sinsid": "231a71c5-f49d-4aba-8e26-9fff5925b0ea",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 48.48129563350035
                },
                {
                    "sinsid": "0349eefe-8c90-4498-b414-95060487205b",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 200.0
                },
                {
                    "sinsid": "4571aaba-b5e8-4aa8-9ad7-280e7129009d",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "KAYAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 74.80940896739129
                },
                {
                    "sinsid": "ba3a1273-51fd-4fc7-bb41-c7f65a84ea5f",
                    "b1Name": "CUMRA",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 100.27131381892444
                },
                {
                    "sinsid": "e7eebe87-d7b9-4b2e-9a22-3b93c5fe3b29",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "DIANAGES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 91.76071380013597
                },
                {
                    "sinsid": "c55ae78a-143d-44b0-a70a-dbed31a5f91f",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "MALTEPE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 119.85127236580516
                },
                {
                    "sinsid": "2369eb5a-5c0e-486f-88af-51d2ebdcad23",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 119.14572327044024
                },
                {
                    "sinsid": "e654cf77-35bb-4023-9f83-db65e354ba69",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 119.5389164785553
                },
                {
                    "sinsid": "f866e230-93ae-41fa-87da-3a79d088fb32",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "CUMRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 89.11862040133781
                },
                {
                    "sinsid": "c737a9c7-5796-4cc1-b489-a3b6da3cb62c",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 108.46779400461182
                },
                {
                    "sinsid": "8bec6004-5b38-4166-8cea-931799c9e0a1",
                    "b1Name": "ALAKOVA",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 153.84966689326993
                },
                {
                    "sinsid": "617ccbc2-a758-406b-8235-40fee54b5dbf",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 104.0095701540957
                },
                {
                    "sinsid": "1064bcf0-b81d-4945-adee-2e4f81560d5c",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 100.88354694485844
                },
                {
                    "sinsid": "212c54d2-3f7d-401d-b5a0-6ad9aa08977d",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": 108.56103448275861
                },
                {
                    "sinsid": "539d7f26-673c-4250-bd64-1aaa6dc5bf82",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 59.62302040816327
                },
                {
                    "sinsid": "353deb9a-be6c-4437-9c17-1555cab193ea",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "NALLIHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 120.88927166788058
                },
                {
                    "sinsid": "febcd272-662f-4636-ac8e-b85e3627a279",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "MAMAK4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 94.39882812500001
                },
                {
                    "sinsid": "aca9ccbc-b1dc-4ba4-9eb0-b9704e9a0320",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "AKKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 94.08947775628626
                },
                {
                    "sinsid": "b8821e4a-6ab3-4616-a906-f31b64a960fe",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 61.519
                },
                {
                    "sinsid": "6ea834b2-3814-43d8-ad37-ebd3481a65bc",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 91.73259536784742
                },
                {
                    "sinsid": "30c63a39-0580-4197-9d53-1c826d5d71ac",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "OKSUT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 56.422628726287265
                },
                {
                    "sinsid": "6f8cded7-5c7f-42f6-a067-0a0c4f220a26",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 93.47485943775101
                },
                {
                    "sinsid": "132f4e92-c9eb-40ff-ba8a-1e07734f5b69",
                    "b1Name": "OKSUTTM",
                    "b2Name": "154",
                    "b3Name": "SENDREME",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 60.32050487156775
                },
                {
                    "sinsid": "6e6caf40-b16a-440a-950e-1ffaea1e19c2",
                    "b1Name": "IMRAHOR",
                    "b2Name": "154",
                    "b3Name": "YILDIZ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 93.22440654843109
                },
                {
                    "sinsid": "7e4acbba-fd64-4158-9c5e-eb8174e55b86",
                    "b1Name": "IMRAH101",
                    "b2Name": "154",
                    "b3Name": "YILDIZ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 93.22781036834925
                },
                {
                    "sinsid": "06bca4c1-01ce-4925-9014-85c44e7e713d",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 93.06276119402986
                },
                {
                    "sinsid": "1353d19a-b0b5-45a1-8741-7d03cc8bc984",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "BAGLUM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -226.65153209109727
                },
                {
                    "sinsid": "de538b99-bb59-4df3-abe5-85d296cadc4e",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "TEKSINGE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 57.531983527796854
                },
                {
                    "sinsid": "feb2268a-b3f1-4a2d-ae7a-671f238a62b5",
                    "b1Name": "TEKSINGE",
                    "b2Name": "154",
                    "b3Name": "KARAMANO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 58.708602590320375
                },
                {
                    "sinsid": "8fb405a1-5b54-4745-a37e-6df1248e5417",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "MACUNKO2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 72.89766666666667
                },
                {
                    "sinsid": "3f6e7439-477d-4421-aee1-bc3472239c9e",
                    "b1Name": "HADIM",
                    "b2Name": "154",
                    "b3Name": "GUNEYSIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 62.29775401069518
                },
                {
                    "sinsid": "03bf0499-0261-4a1e-b9db-15315cc1233f",
                    "b1Name": "KARMNBES",
                    "b2Name": "154",
                    "b3Name": "AYRANCI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:42:00.000Z",
                    "AVG(maxValue)": 66.43049450549451
                },
                {
                    "sinsid": "7166be3f-059c-4162-b684-339d9d121809",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "AKSRYOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 68.94253233492172
                },
                {
                    "sinsid": "ecd7615e-572c-447c-ab19-09f35efe72f2",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 64.46614130434783
                },
                {
                    "sinsid": "ff2e4fa3-7c67-44e0-92df-a1892fae6718",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "ERYAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 71.37234534330386
                },
                {
                    "sinsid": "b8e26615-e99c-4755-8c61-a5f88ac8b0a1",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "KARAPINA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 46.957814840027226
                },
                {
                    "sinsid": "d51a6a2e-e5bb-41f1-8ad9-45c86fd9dae6",
                    "b1Name": "GUNEYSNR",
                    "b2Name": "154",
                    "b3Name": "CUMRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 56.221535836177466
                },
                {
                    "sinsid": "e33588f7-d29c-4af5-9051-c9021c8b1fb4",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 43.96211343686698
                },
                {
                    "sinsid": "da25ae1b-f343-4182-9178-0a63a004d08d",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "UMITKOY2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 56.19769230769231
                },
                {
                    "sinsid": "9fedaf64-92fa-462d-ab61-633a073eed53",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.366232616940586
                },
                {
                    "sinsid": "668d2547-88d8-4283-a4eb-c34cad4109ca",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 37.03214480874317
                },
                {
                    "sinsid": "af155940-1196-42d7-bf54-13874fc22d8d",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "HASKOY-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 74.78725274725277
                },
                {
                    "sinsid": "dbd700a7-3ea7-4b44-a0ea-19cd94bea97f",
                    "b1Name": "SIZIR",
                    "b2Name": "154",
                    "b3Name": "KAYSRKAP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 62.93717006802722
                },
                {
                    "sinsid": "f4e5852d-f279-4a40-8e7c-645613465f1c",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 82.23755282890252
                },
                {
                    "sinsid": "4cf3d059-c3d0-4503-980c-b5888cc82cd6",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 61.97782993197279
                },
                {
                    "sinsid": "e8f68226-3b4a-4ecb-96d2-98d631ace25a",
                    "b1Name": "KARGIHS",
                    "b2Name": "154",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": 60.188043052837564
                },
                {
                    "sinsid": "06ce0587-81ec-440d-81ec-09a55c95550d",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "CAMLICA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.50618233618234
                },
                {
                    "sinsid": "f49e376b-05e6-4370-8fae-9acac97dffa0",
                    "b1Name": "KEPEZKAY",
                    "b2Name": "154",
                    "b3Name": "HADIM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 53.756897959183675
                },
                {
                    "sinsid": "6f2d5870-4c91-40c9-b0a1-0b01e4ac4720",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 44.4152610441767
                },
                {
                    "sinsid": "4c9c2e4a-fca1-43a2-a715-cb0052d3a1b3",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "NIGDE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 66.4807970027248
                },
                {
                    "sinsid": "a2f87c82-7d4a-45ca-b8ba-26b77918d0d6",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "SELCUKLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 69.25147159479808
                },
                {
                    "sinsid": "39eeadf3-8671-4e13-99af-04870e571527",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "BEYPAZAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 71.19368998628258
                },
                {
                    "sinsid": "4e43b115-fa25-4414-924f-1f24528df3a5",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "OYAK1GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 67.80165193745749
                },
                {
                    "sinsid": "617042b4-6d61-41ae-953d-a11f3300884a",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "INCEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.52987738419618
                },
                {
                    "sinsid": "f6d0b17a-d385-4da1-a256-27a7c623d07e",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "MUDURNU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 44.27311019567456
                },
                {
                    "sinsid": "88862231-80ea-44d6-8680-5b29f44e40d0",
                    "b1Name": "MALTEPE",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 52.407551159618
                },
                {
                    "sinsid": "6864f3b3-6ebb-4ad9-a270-d41cdb3da430",
                    "b1Name": "YOZGAT",
                    "b2Name": "154",
                    "b3Name": "YIBITAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 46.15544897959183
                },
                {
                    "sinsid": "16418829-235c-40e1-9d55-8b44be7ca3e3",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 43.100357624831304
                },
                {
                    "sinsid": "ddcd0f8c-c0df-48cb-b925-7c9366aee45b",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -308.30576766304347
                },
                {
                    "sinsid": "4fb4bea3-a74f-4b04-99b5-ff2e37718e44",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "ALAKOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 59.275252525252526
                },
                {
                    "sinsid": "2cac7a90-c600-419a-a8b5-f73bb08f607a",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "ERCIYESR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 43.085443223443214
                },
                {
                    "sinsid": "3a561722-4f4a-4a89-a2ce-aa7c8174dcdb",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 60.616265151515165
                },
                {
                    "sinsid": "f3221cc4-678c-47b1-ab39-f13ed30c4ac2",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 68.61936356404138
                },
                {
                    "sinsid": "2ce004bc-298b-4d77-a278-6679a0ea802d",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "POLATLI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.158794277929156
                },
                {
                    "sinsid": "a21a2051-69ca-4246-a4e6-083d9761024b",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "UMITKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 59.36993197278911
                },
                {
                    "sinsid": "9d004b57-f621-4d7d-8150-0dff7232bbde",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 40.511842105263156
                },
                {
                    "sinsid": "e724dccc-a347-4fc1-9c54-c3726723f3d2",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "PETLAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 54.20856621004566
                },
                {
                    "sinsid": "f822aa2c-0411-4aac-96d2-247a1ea66d3b",
                    "b1Name": "ADATOPRK",
                    "b2Name": "154",
                    "b3Name": "DDYKOCAH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.64431454418928
                },
                {
                    "sinsid": "7a1f0119-a773-435c-8d56-5fa5d62425d3",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "MACUNKO1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 61.6647619047619
                },
                {
                    "sinsid": "f97e39f5-275e-4f43-bdea-2fc3d220e4f8",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "YAZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 62.713262942779295
                },
                {
                    "sinsid": "2e362cff-5fa5-437a-ab88-b6b87dc3e1a1",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "KAYSER21",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 62.41040163376447
                },
                {
                    "sinsid": "5422ddfc-8508-4712-877a-bac309aa76b1",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 66.39154870940881
                },
                {
                    "sinsid": "eb533391-8909-4ea3-a45f-99aa035f3afb",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "ALC-UMIT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.289597544338335
                },
                {
                    "sinsid": "8ad1f19b-1a79-422e-87ee-1dbcf0f56d64",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "KAYSER23",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 60.998483606557365
                },
                {
                    "sinsid": "fa01bb1a-2f9b-4d35-8ca8-136319988959",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "DERINKUY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 53.44096180081855
                },
                {
                    "sinsid": "febc2bc3-6156-444b-a47a-7743788a6249",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "AKSURES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.440891763104155
                },
                {
                    "sinsid": "dca9b462-541a-4d8d-87ae-de3c6c10335a",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:56:00.000Z",
                    "AVG(maxValue)": 26.647418300653595
                },
                {
                    "sinsid": "61463eba-0639-483f-9c80-15f52d65d6c1",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 70.92567255434783
                },
                {
                    "sinsid": "4052b2c9-c24d-4f2d-95e3-47358c5f9e8a",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:30:00.000Z",
                    "AVG(maxValue)": 14.010405844155844
                },
                {
                    "sinsid": "c1ca444c-6610-4b7c-9a82-d8977580c408",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "KAYSER22",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 59.73426520847574
                },
                {
                    "sinsid": "d238d0a8-1183-4170-904d-fd0da5b1b4e7",
                    "b1Name": "KARAMANO",
                    "b2Name": "154",
                    "b3Name": "KARAMANB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 36.909018404907975
                },
                {
                    "sinsid": "d861c028-13c2-4c33-8c79-1d1fb2b061f3",
                    "b1Name": "KULU",
                    "b2Name": "154",
                    "b3Name": "EMIRLER",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 58.05810534016093
                },
                {
                    "sinsid": "95329efd-d60c-424b-8dd1-d9fc024cb3b0",
                    "b1Name": "YAMULAHS",
                    "b2Name": "154",
                    "b3Name": "CINKUR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:27:00.000Z",
                    "AVG(maxValue)": 74.72311224489796
                },
                {
                    "sinsid": "a92a6a91-4f2c-4814-8711-8a3fabac19a1",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "KULU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 41.80298772169168
                },
                {
                    "sinsid": "74fc66eb-5e37-475b-8f84-089ab7dd4d6a",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "CEKEREKH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -33.650974440894565
                },
                {
                    "sinsid": "76392279-6b71-473e-a730-3fd497983239",
                    "b1Name": "KARATAY",
                    "b2Name": "380",
                    "b3Name": "SEYDISEH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 0.3300094161958555
                },
                {
                    "sinsid": "c1ee2b28-f8e5-4b90-a31c-69eb1c884f86",
                    "b1Name": "HACILAR",
                    "b2Name": "154",
                    "b3Name": "KIRIKKLA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 38.098582866293036
                },
                {
                    "sinsid": "91d91e04-21fa-4cb8-8425-ef4fd48bdda3",
                    "b1Name": "KIRSEHIR",
                    "b2Name": "154",
                    "b3Name": "KIZILRMK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 49.01912828947368
                },
                {
                    "sinsid": "c42668ac-b558-4b62-9882-25e9913f7cc9",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 64.0069775357386
                },
                {
                    "sinsid": "1584cc8c-8360-4cde-8eeb-ebe775f492f3",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "DDYPINAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 32.53455993930197
                },
                {
                    "sinsid": "134bf7ce-db28-44d9-95f1-c7d03e362207",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.420081632653061
                },
                {
                    "sinsid": "bc9938b7-9dec-4477-84de-57848357784a",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "BOLU-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": 54.79605084745763
                },
                {
                    "sinsid": "26332173-a2c2-4ff8-b6b1-ff746501d985",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "BAGLAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 60.94878911564625
                },
                {
                    "sinsid": "3a8b70c0-ecdb-47b5-941d-b28d9d11c3b3",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "BAGLICAG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 54.16987780040734
                },
                {
                    "sinsid": "a236fe41-e795-4724-957d-6c802e01d3e4",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "HACILAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 47.354672413793104
                },
                {
                    "sinsid": "eb6bd1d4-9067-495e-b222-1f315dadd852",
                    "b1Name": "SENDIRMK",
                    "b2Name": "154",
                    "b3Name": "TAKSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 31.417688647178792
                },
                {
                    "sinsid": "0fe20931-9c9f-4471-88be-cc99f43113bc",
                    "b1Name": "POLATLI",
                    "b2Name": "154",
                    "b3Name": "BEYKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 8.847191547375594
                },
                {
                    "sinsid": "b8619d29-14e4-41f9-8ead-7ba0a545b215",
                    "b1Name": "BOR",
                    "b2Name": "154",
                    "b3Name": "NIGDEOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 28.232450646698435
                },
                {
                    "sinsid": "b7e8316e-5120-4fec-bf5e-99fe670524df",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "BASTAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 43.80774665042632
                },
                {
                    "sinsid": "1df77157-6f24-4ab4-8cfc-a9a6a2efdec4",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "BASTAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 43.77858500527983
                },
                {
                    "sinsid": "029b6a89-324f-4248-8c99-79dbe085ee1c",
                    "b1Name": "POLATLI",
                    "b2Name": "154",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.431475295755047
                },
                {
                    "sinsid": "61ff387f-0679-441d-8518-2194150654f5",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "MAMAK3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:45:00.000Z",
                    "AVG(maxValue)": 59.00765363128493
                },
                {
                    "sinsid": "3f280f1a-da7c-4482-a77e-ed62ebd842e7",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "MAMAK3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:45:00.000Z",
                    "AVG(maxValue)": 59.33651724137931
                },
                {
                    "sinsid": "e7efe6fe-ded5-4cc5-b269-49c8c3a3a89c",
                    "b1Name": "BOR",
                    "b2Name": "154",
                    "b3Name": "BOROSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 41.56136734693877
                },
                {
                    "sinsid": "4bdf1924-361d-4626-9611-ca4305d49cce",
                    "b1Name": "YIBITAS",
                    "b2Name": "154",
                    "b3Name": "YERKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.05903343023255
                },
                {
                    "sinsid": "b96ce559-91b1-4b8a-ad5c-8ea7f741d758",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 49.882455871066774
                },
                {
                    "sinsid": "8742a840-5e81-4cde-a96f-909dfc3f0b41",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "ERKILET",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 53.361519073569475
                },
                {
                    "sinsid": "d275aa0f-4c7b-44de-a411-4acd269777a3",
                    "b1Name": "PETLAS",
                    "b2Name": "154",
                    "b3Name": "KIRSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 49.43110456553756
                },
                {
                    "sinsid": "bd5ee613-4d64-4f31-b5b4-1e62dfddbaa0",
                    "b1Name": "BEYPAZAR",
                    "b2Name": "154",
                    "b3Name": "ETI-SODA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 48.90122529644269
                },
                {
                    "sinsid": "20675deb-e5f5-4832-8eb9-9966c4afd5f7",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "SORGUN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:29:00.000Z",
                    "AVG(maxValue)": 39.8222418879056
                },
                {
                    "sinsid": "a9df9911-8328-4af7-9e55-9e8f46c6ff36",
                    "b1Name": "SIVRIHIS",
                    "b2Name": "154",
                    "b3Name": "BEYLIKKO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.602835195530725
                },
                {
                    "sinsid": "a7bad02e-e419-4ad5-a0bd-50215b534ff0",
                    "b1Name": "R3KRMN1R",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 49.54418541240628
                },
                {
                    "sinsid": "e5bfc197-e393-4335-8fe3-43d34a2bbf4c",
                    "b1Name": "BOROSB",
                    "b2Name": "154",
                    "b3Name": "TUMOSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 48.23872354948805
                },
                {
                    "sinsid": "fd212a25-759b-4219-83ed-2a2b322ee9d9",
                    "b1Name": "CUMRA",
                    "b2Name": "154",
                    "b3Name": "ABHOYUGU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.595204359673026
                },
                {
                    "sinsid": "2f4c6d7b-3644-4eff-8f84-0b327a4a41c5",
                    "b1Name": "R3KRMN1R",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 51.64096385542168
                },
                {
                    "sinsid": "5e99fd4a-02f0-47ea-b12a-e307237e39a5",
                    "b1Name": "R3KRMN1R",
                    "b2Name": "154",
                    "b3Name": "KEPEZKAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 51.19023232323232
                },
                {
                    "sinsid": "ad33e263-6009-47ae-b850-20ae108be5e7",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "BUSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 45.426422893481714
                },
                {
                    "sinsid": "ca20dc9f-4ca7-42d5-9b42-8166cae87695",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "YOZGAT-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.945548738922966
                },
                {
                    "sinsid": "f632da58-aebb-4121-835a-ff8e68a161a2",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "ALTINEKI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.35274897680763
                },
                {
                    "sinsid": "6d78ef3c-58bb-4cca-8c6a-ba05e7c628bb",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "MAV-BIO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 32.23378048780488
                },
                {
                    "sinsid": "5c6d486d-df37-4b97-acb6-9668ef7fdec2",
                    "b1Name": "MAMAK",
                    "b2Name": "154",
                    "b3Name": "HASKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.933489795918376
                },
                {
                    "sinsid": "e2c60b5c-f9f7-4222-ad01-31a2d7dc2f8d",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 23.68450681635926
                },
                {
                    "sinsid": "ddf907dd-ce4b-4017-97aa-ba994b36b8b3",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 5.176337644656228
                },
                {
                    "sinsid": "eb21484c-8c8a-473a-84ea-30541a788801",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "BILKENT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 38.88106730115568
                },
                {
                    "sinsid": "4d1c3d6a-5836-47b7-a3f5-57f399a0835d",
                    "b1Name": "SELCUKLU",
                    "b2Name": "154",
                    "b3Name": "ERENKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 45.56572108843538
                },
                {
                    "sinsid": "d722805a-06ce-434c-acbf-9dcbce28da3e",
                    "b1Name": "ALTINEKN",
                    "b2Name": "154",
                    "b3Name": "CIHANBEY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.79193328795099
                },
                {
                    "sinsid": "cc5db0d4-389c-4372-90c1-4eb49b844fff",
                    "b1Name": "NIGDE",
                    "b2Name": "154",
                    "b3Name": "NIGDEOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 19.571774303195106
                },
                {
                    "sinsid": "a5174acc-ba04-4a53-a518-e5ee57b4befe",
                    "b1Name": "BEYLIKKO",
                    "b2Name": "154",
                    "b3Name": "POLATLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:44:00.000Z",
                    "AVG(maxValue)": -7.584328358208955
                },
                {
                    "sinsid": "ed4081b7-128b-49d5-b693-10329488a1ca",
                    "b1Name": "A.HOYUGU",
                    "b2Name": "154",
                    "b3Name": "SEYDISEH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 33.17927116827438
                },
                {
                    "sinsid": "afa5f45e-3a56-4b8d-9a1f-dafac1305e7c",
                    "b1Name": "KEPEZKAY",
                    "b2Name": "154",
                    "b3Name": "KARAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 23.911914168937322
                },
                {
                    "sinsid": "3fcc25d3-69ff-441e-a228-9996947b8ebd",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 19.820568383658973
                },
                {
                    "sinsid": "c6d8aa5c-53c2-4b20-9d41-99f525f452ae",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 33.28515358361775
                },
                {
                    "sinsid": "affaac70-d139-465f-a7db-dca288d04560",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "DDYGOZLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 41.79458563535912
                },
                {
                    "sinsid": "ffd77e77-df1c-4890-af56-5b7d3b960bdd",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "NEVSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 15.628070175438594
                },
                {
                    "sinsid": "c97293d8-f17e-4288-b7eb-2d319f7894cb",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 13.22912013536379
                },
                {
                    "sinsid": "ff4e9e9b-5fcb-4676-9b53-6a91b9104276",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "KALABA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 22.283712534059944
                },
                {
                    "sinsid": "a920e80a-585a-4891-b005-06bbf9cdf2e8",
                    "b1Name": "BALGAT",
                    "b2Name": "154",
                    "b3Name": "CIGDEMGI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.172985685071573
                },
                {
                    "sinsid": "39897118-7f73-4ab4-a0bb-df6e3456d487",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 26.59270998415214
                },
                {
                    "sinsid": "beba1faa-d52b-48ef-82ce-b394e23b63cb",
                    "b1Name": "YERKOY",
                    "b2Name": "154",
                    "b3Name": "KIRSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 26.358047223994898
                },
                {
                    "sinsid": "299cb9a0-42f2-4171-98f6-bbc74717d900",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "SORGUN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.32589918256131
                },
                {
                    "sinsid": "b63bb96c-1287-4d13-900e-5f9add433d3b",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "NEVSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 12.236148097826087
                },
                {
                    "sinsid": "0227909b-6f69-465c-9d9e-8826efda9235",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 30.773272108843543
                },
                {
                    "sinsid": "29bce1d6-8b0c-4f03-b261-3c070f335776",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "KAYSER-4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.528142857142846
                },
                {
                    "sinsid": "afa4c823-2cec-47d0-beb7-d828b2241ca8",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "KARAMANO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 10.596057298772168
                },
                {
                    "sinsid": "68111e02-ae43-4b3b-bf01-9dfe3bb206d6",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "KAYSERI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 32.82460544217687
                },
                {
                    "sinsid": "a56b9352-37de-4e52-a471-30d008665b72",
                    "b1Name": "ERYAMAN",
                    "b2Name": "154",
                    "b3Name": "ANKARASA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.430951086956522
                },
                {
                    "sinsid": "9318f8f6-bd0f-4a49-8117-eefd1f8a0ea4",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 41.77423809523809
                },
                {
                    "sinsid": "103ecac0-8e13-4874-b642-509f2538bc4a",
                    "b1Name": "SARKISLA",
                    "b2Name": "154",
                    "b3Name": "SIZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 44.66446185286103
                },
                {
                    "sinsid": "2010557e-bfd7-4678-91be-b6f43d00b9da",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "ANK-SAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.34462950373894
                },
                {
                    "sinsid": "4c8914a2-d2ec-4bc5-a3c6-321c92e2d6bb",
                    "b1Name": "AKSRYOSB",
                    "b2Name": "154",
                    "b3Name": "TUMOSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.67399727148704
                },
                {
                    "sinsid": "53a3afa4-b470-49fb-a7e6-8cff1b52da86",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "G4BOR-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 21.529167832167833
                },
                {
                    "sinsid": "36c19f1c-c4dd-4f65-a346-2fe37390437e",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "KIZOREN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 27.504734883720925
                },
                {
                    "sinsid": "a2884cf9-1a7d-4f83-afe1-41a3fa3a37e4",
                    "b1Name": "ALTINOVA",
                    "b2Name": "154",
                    "b3Name": "DDYCAYIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 24.632074829931973
                },
                {
                    "sinsid": "4af747d0-7ff6-460d-a321-7fab765d1b65",
                    "b1Name": "POLATLI",
                    "b2Name": "154",
                    "b3Name": "POLATCMT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 7.950054570259213
                },
                {
                    "sinsid": "b8b2be55-ef3e-4d03-81cf-23f1c1c8b5ce",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAYSERI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 40.31730245231607
                },
                {
                    "sinsid": "a4214ab4-f563-4ca0-a641-f2aa0f543456",
                    "b1Name": "HASKOY",
                    "b2Name": "154",
                    "b3Name": "AKKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 39.022577319587626
                },
                {
                    "sinsid": "225a0248-b26a-4128-86e8-096d2a955fd5",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.489081632653054
                },
                {
                    "sinsid": "f03cd452-d53d-4d3c-bbe7-3f2dc2446920",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "AKKOPGI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 27.44091711956521
                },
                {
                    "sinsid": "bc46f783-3edb-4fbb-8713-03d71fda7e58",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "AKKOPGI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 35.33960409556313
                },
                {
                    "sinsid": "cd22d782-04c2-4cc0-b93f-dba5892553b1",
                    "b1Name": "IMRAHOR",
                    "b2Name": "154",
                    "b3Name": "CIGDEMGI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 26.865878746594007
                },
                {
                    "sinsid": "cf00b54d-9567-4757-8665-4333a1dc4592",
                    "b1Name": "IMRAH101",
                    "b2Name": "154",
                    "b3Name": "CIGDEMGI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 26.864611716621248
                },
                {
                    "sinsid": "ef50e09c-9ed5-4707-a267-3cd77ba60bed",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "BOR_OSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.2829648241206
                },
                {
                    "sinsid": "11136c38-18c0-4615-9cc1-28e2f422656e",
                    "b1Name": "KOLUKISA",
                    "b2Name": "154",
                    "b3Name": "ALTINOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 36.60957547169811
                },
                {
                    "sinsid": "c9d60dea-7d5c-464f-9547-e4b40894d8ee",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "DDYNENEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:43:00.000Z",
                    "AVG(maxValue)": 28.18505747126437
                },
                {
                    "sinsid": "48a35977-2969-4ee8-b9b1-5d88558d5650",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "DDYNENEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:43:00.000Z",
                    "AVG(maxValue)": 28.220065217391305
                },
                {
                    "sinsid": "f5908a54-7ee8-426f-bbd2-e249bb0e1dd0",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "POLATCMT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 10.37924965893588
                },
                {
                    "sinsid": "042dfc93-156e-4104-b564-2109c7a6eeb3",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "YAYSUNGE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 19.089431728492496
                },
                {
                    "sinsid": "7bfa0cfe-fb18-41eb-8b08-646b8aca1525",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 14.740348953140577
                },
                {
                    "sinsid": "6cb65809-c585-4fb4-bcf5-0f5a90f82297",
                    "b1Name": "CEKERKHV",
                    "b2Name": "154",
                    "b3Name": "SORGUN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 35.12535423925667
                },
                {
                    "sinsid": "902e267d-5137-4b33-bb3f-387f2cb17971",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 37.7176902173913
                },
                {
                    "sinsid": "b9adedf9-cdc5-4289-ab71-bbc0b9d72aab",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "KURSUNL1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -35.2075956284153
                },
                {
                    "sinsid": "188b89bc-fbf4-410f-a4e5-ce99f2b21392",
                    "b1Name": "KIZOREN",
                    "b2Name": "154",
                    "b3Name": "ESMEKAYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.992641252552758
                },
                {
                    "sinsid": "aa38c49c-9c1e-4d12-9c87-56b4e34c63dd",
                    "b1Name": "ALAKOVA",
                    "b2Name": "154",
                    "b3Name": "MERAMGIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 34.858089734874234
                },
                {
                    "sinsid": "3a95527b-285b-495c-abd0-dc996d398519",
                    "b1Name": "CIHANBEY",
                    "b2Name": "154",
                    "b3Name": "KULU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.693544648943416
                },
                {
                    "sinsid": "66361ce5-cdff-4208-9028-e0ed2a7e5fc0",
                    "b1Name": "YAYSUNGE",
                    "b2Name": "154",
                    "b3Name": "ATAHANGS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.00574048913043
                },
                {
                    "sinsid": "3483efaa-5e69-4077-b8d7-1102e15fec1e",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "BOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 7.5177849002849015
                },
                {
                    "sinsid": "582ec124-2e8d-4dcc-838d-6d4adcbb8139",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:47:00.000Z",
                    "AVG(maxValue)": 25.045700076511096
                },
                {
                    "sinsid": "7b4c69fd-6eb8-4d2c-a18d-10c5bec704dd",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 49.157777777777774
                },
                {
                    "sinsid": "a56df038-e55f-4a09-a8a3-90d706aac53d",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "ESENBOG2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.745426039536465
                },
                {
                    "sinsid": "843d7b1f-d22b-4b8b-909f-e64c28cffcd8",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "YAHYALI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 25.947487562189057
                },
                {
                    "sinsid": "e5e33773-19d7-434e-94b5-bb0bf72fd2a9",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "ESENBOG1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 31.07702316076295
                },
                {
                    "sinsid": "4df527b9-7a36-4c56-b03c-97009670b795",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "KURSUNL2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -19.900802395209578
                },
                {
                    "sinsid": "c5a1f9c4-7aca-4cc7-b356-daebd3ebf8e1",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 24.143714902807773
                },
                {
                    "sinsid": "54646057-fa3f-4172-ad21-10f41ea6d9b6",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 22.945418006430874
                },
                {
                    "sinsid": "00d34fb7-c866-40f6-b888-88be58e7faa6",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.788751084128357
                },
                {
                    "sinsid": "688ec87b-611a-48af-944e-fcecc71d21ce",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "KAZANTM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 38.845600303951365
                },
                {
                    "sinsid": "246f5b7b-5b5d-4f49-9c8a-e1862bba3db9",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "YOZGAT-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 24.665928961748634
                },
                {
                    "sinsid": "f339ea68-486d-4aed-941b-80e4a5c853a3",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 14.884966542750929
                },
                {
                    "sinsid": "e5d7fde2-6549-4305-b4ca-9eedac74ff8b",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "MISLIOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.410074982958413
                },
                {
                    "sinsid": "b3f6f8c2-6750-44d8-b288-8a14f1288108",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "KAYACIK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 18.315876288659794
                },
                {
                    "sinsid": "ea12c2cb-71f7-4f37-a693-e2c7bb8d02ca",
                    "b1Name": "KARAMANR",
                    "b2Name": "154",
                    "b3Name": "AKYEL-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:15:00.000Z",
                    "AVG(maxValue)": 20.466857142857144
                },
                {
                    "sinsid": "8be3623e-afbc-4576-a19e-e8cbafc99f76",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "OVACIK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 32.977429178470246
                },
                {
                    "sinsid": "98255ef8-64a2-400f-a712-7b1159a9fc95",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "KIRIKKAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.452262228260867
                },
                {
                    "sinsid": "c6475b3f-2e91-4a8d-a3ae-3b8df98a79a1",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "E.SEHIR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.680939947780677
                },
                {
                    "sinsid": "69cfd618-c6f5-4526-8ee8-149463d2d869",
                    "b1Name": "KARAMANR",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.140292517006802
                },
                {
                    "sinsid": "748067ec-f937-47a9-b6d6-b5d64af41dca",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "DERINKU1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.650442779291556
                },
                {
                    "sinsid": "cfa1a09f-6279-4470-ba66-496536509bce",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "OVACIK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 32.50617605633803
                },
                {
                    "sinsid": "9ade1822-a6d8-49ef-a25c-c723bc9231fd",
                    "b1Name": "POLATCMT",
                    "b2Name": "154",
                    "b3Name": "POLATLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -4.235702647657842
                },
                {
                    "sinsid": "50b59403-506c-42b0-b9e8-7c32febada40",
                    "b1Name": "KARALIKR",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 27.202045454545456
                },
                {
                    "sinsid": "ff12f1bb-7a6f-4937-be09-8f6732494c9c",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "KAYACIK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 17.53401176470588
                },
                {
                    "sinsid": "041bd45d-d0be-48de-8223-c5f617b4560f",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "CIMPOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 15.456924050632914
                },
                {
                    "sinsid": "173ae7f4-e4e2-4c9f-8126-d47906a014c2",
                    "b1Name": "KARALIKR",
                    "b2Name": "154",
                    "b3Name": "CEKRKHVZ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 17.558487140695917
                },
                {
                    "sinsid": "2ca5aae5-0d37-4088-b10e-a14eed4ed639",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "CIGDEM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.082834806254247
                },
                {
                    "sinsid": "cd8b5f03-a22b-4602-95db-927de02f5a86",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "HASKOY-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.667825494205866
                },
                {
                    "sinsid": "99688e3e-b3aa-4853-8884-957fd79eaabc",
                    "b1Name": "ALTINOVA",
                    "b2Name": "154",
                    "b3Name": "YUNAK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.552712440516656
                },
                {
                    "sinsid": "63932786-6733-47b8-8985-9ab9cdbad837",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "HOTAMIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.586716621253405
                },
                {
                    "sinsid": "f5689c95-e80d-4bfe-99c7-0b8d19441676",
                    "b1Name": "SENDIRMK",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.291960517358747
                },
                {
                    "sinsid": "f0ade9cd-ac49-457f-a998-298f803bb769",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "DERINKU2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.031761904761908
                },
                {
                    "sinsid": "809a2c78-fcb7-4044-a0a3-fa8b664222c3",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "CIMPOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 15.526859956236324
                },
                {
                    "sinsid": "2f228cc1-8bdd-424a-9025-4cdb95179bc5",
                    "b1Name": "NIGDEOSB",
                    "b2Name": "154",
                    "b3Name": "NIGDE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.145741496598639
                },
                {
                    "sinsid": "c948f4c5-c81f-47fc-bbc3-0f64f9862833",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "ESMEKAYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 9.607159400544958
                },
                {
                    "sinsid": "038e51b1-dfc6-4c99-9251-acee672802a6",
                    "b1Name": "PINARBAS",
                    "b2Name": "154",
                    "b3Name": "SARKISLA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.411756296800544
                },
                {
                    "sinsid": "79766c45-b38a-4397-a2bf-6261c5ab5623",
                    "b1Name": "SORGUN",
                    "b2Name": "154",
                    "b3Name": "BOZOK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.681769911504423
                },
                {
                    "sinsid": "a5298c09-a570-44d2-877b-f5d2865b7f8b",
                    "b1Name": "SARIYAR",
                    "b2Name": "154",
                    "b3Name": "NALLIHA2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 13.11671875
                },
                {
                    "sinsid": "dc4d2880-0b41-406d-b4ba-e137efb87451",
                    "b1Name": "HOTAMIS",
                    "b2Name": "154",
                    "b3Name": "BUSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 22.067880027266533
                },
                {
                    "sinsid": "e903e7a7-2791-47af-ab0b-38f1dfeff8cd",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.917683923705724
                },
                {
                    "sinsid": "4a1d4ef2-42ca-44d3-940c-d44f5be60db8",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.210251700680272
                },
                {
                    "sinsid": "82f0e103-3807-4d84-aa27-893fd8a9b638",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.210380952380952
                },
                {
                    "sinsid": "e406c8a9-007e-4e5a-8b92-66393968836c",
                    "b1Name": "KESIKKOP",
                    "b2Name": "154",
                    "b3Name": "KIZ-ATAK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.5405987261146494
                },
                {
                    "sinsid": "96ed450d-a88a-4e1e-9ad1-fdca024853e4",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "ORTAKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 22.38572888283379
                },
                {
                    "sinsid": "d6561edc-4303-4929-b0c3-c2ec8632112e",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "SANAYITM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 29.472135922330093
                },
                {
                    "sinsid": "19e3ee75-3e34-43cf-b8a3-d7994486b836",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 37.60177831912302
                },
                {
                    "sinsid": "75921b46-b829-4df8-86e4-7d5eae9f0034",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:36:00.000Z",
                    "AVG(maxValue)": 31.452972972972972
                },
                {
                    "sinsid": "89b4295e-1c24-407e-9acd-94db57a0a264",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "DAGYAKA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 21.317296099290775
                },
                {
                    "sinsid": "9101b59d-bfa0-4fcd-8f0f-a1069d4d7ce4",
                    "b1Name": "ORTAKOY",
                    "b2Name": "154",
                    "b3Name": "KUT-ATA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.999420586230404
                },
                {
                    "sinsid": "e68c876f-6649-46e1-8569-9f41d42c4589",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:02:00.000Z",
                    "AVG(maxValue)": 11.327302259887006
                },
                {
                    "sinsid": "cb9b2593-3118-4069-b9b9-be41eb68b907",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "SKOCHSAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": 17.320309597523217
                },
                {
                    "sinsid": "f033a614-7f28-43e9-89c4-ed234c5fd545",
                    "b1Name": "KESIKKOP",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 1.6899321113374064
                },
                {
                    "sinsid": "7b87a925-54a8-4212-ac46-a6a3b4a8205e",
                    "b1Name": "NEVSEHIR",
                    "b2Name": "154",
                    "b3Name": "DERINKUY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.180496598639458
                },
                {
                    "sinsid": "f6b5fe96-51d6-43be-946d-b03b1cf1c1d5",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "KESIKKOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:29:00.000Z",
                    "AVG(maxValue)": 14.854819819819822
                },
                {
                    "sinsid": "cb132bb2-32ad-4ddd-8d6f-3ecc34388805",
                    "b1Name": "BEYLIKKO",
                    "b2Name": "154",
                    "b3Name": "SIVRIHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:44:00.000Z",
                    "AVG(maxValue)": -12.228636363636362
                },
                {
                    "sinsid": "32d464a6-ed71-4877-abe5-811121c8ebfe",
                    "b1Name": "BEYPAZAR",
                    "b2Name": "154",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 11.178103448275863
                },
                {
                    "sinsid": "03cfb75f-a251-4c39-9324-33cefb96552f",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.676261925411969
                },
                {
                    "sinsid": "2ad457c3-1f54-418b-b11a-25431c8ba5f5",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "UZAYOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 25.251520706042093
                },
                {
                    "sinsid": "5342cc88-1a97-4c40-a286-7cf20f57e046",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "SINCANTM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 26.909853264856938
                },
                {
                    "sinsid": "a76b4a98-8f79-4298-9350-35f0a491cb56",
                    "b1Name": "SARIYAR",
                    "b2Name": "154",
                    "b3Name": "NALLIHA1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 10.797839080459768
                },
                {
                    "sinsid": "253368a7-c41b-4637-9383-5fb9d0d30374",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "KAYACIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:40:00.000Z",
                    "AVG(maxValue)": 18.897045454545452
                },
                {
                    "sinsid": "fd521aaf-3a11-4bec-9f89-23315c526d05",
                    "b1Name": "BAGLICAG",
                    "b2Name": "154",
                    "b3Name": "UMITKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:42:00.000Z",
                    "AVG(maxValue)": 17.849375000000002
                },
                {
                    "sinsid": "5f229307-9134-4a58-8d9e-7cd8cbae13da",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "OSTIMOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 11.300320381731424
                },
                {
                    "sinsid": "8f167ea1-ceb2-464a-8084-e7b898cc9cfc",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "ALACA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 10.768489795918365
                },
                {
                    "sinsid": "02f95310-1def-47f0-81a6-3ba7dd318979",
                    "b1Name": "CIGDEM",
                    "b2Name": "154",
                    "b3Name": "BILKENT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.83706896551724
                },
                {
                    "sinsid": "eb085381-9883-43ba-a2ee-6499be9e5c0d",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:07:00.000Z",
                    "AVG(maxValue)": 11.800374999999997
                },
                {
                    "sinsid": "d8cee981-b906-4963-a92c-d5c173e32889",
                    "b1Name": "YILDIZ",
                    "b2Name": "154",
                    "b3Name": "INCEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.2991212534059948
                },
                {
                    "sinsid": "63e642c6-8118-4461-8d97-437788470c59",
                    "b1Name": "BASTAS",
                    "b2Name": "154",
                    "b3Name": "KIRIKKAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 5.933471749489449
                },
                {
                    "sinsid": "cc42e7a8-b53b-4aec-9f06-30d594677381",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "AKKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 22.252019034670294
                },
                {
                    "sinsid": "705ddc10-ec81-4d79-8b1f-a8a258bc396f",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:08:00.000Z",
                    "AVG(maxValue)": 13.050672268907565
                },
                {
                    "sinsid": "569e6344-4bf1-4ddd-9b78-91bed504f930",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.5872653061224486
                },
                {
                    "sinsid": "fbde270b-e50b-4360-a2bc-9f23b0c91a73",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.596571428571428
                },
                {
                    "sinsid": "cf5f00ba-378d-40fe-8bae-d6b43a413c0d",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.14490553306343
                },
                {
                    "sinsid": "f05e58a1-1177-4f64-ac8a-30929934d4b2",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "BAKENERJ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 18.048491735537194
                },
                {
                    "sinsid": "f87757d6-0f25-4298-9c97-fc0746fc5536",
                    "b1Name": "HACILAR",
                    "b2Name": "154",
                    "b3Name": "KIRDEMIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.373893581081077
                },
                {
                    "sinsid": "f9425fd2-e486-46bc-b7c1-22c827524d03",
                    "b1Name": "MISLIOVA",
                    "b2Name": "154",
                    "b3Name": "NIGDE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.396988443235895
                },
                {
                    "sinsid": "2f38aabf-9c4f-4f50-9b18-474a720ac2fc",
                    "b1Name": "CIMPOR",
                    "b2Name": "154",
                    "b3Name": "K.KALE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 1.971493860845839
                },
                {
                    "sinsid": "d1c3c52f-0340-46c9-b670-c8fb2bb802c0",
                    "b1Name": "KAYACIK",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:40:00.000Z",
                    "AVG(maxValue)": 21.44396103896103
                },
                {
                    "sinsid": "91b5313f-fbba-4dfd-8c2a-10436595c3a9",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "TAKSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.638720217835262
                },
                {
                    "sinsid": "2d2ce2a5-a1eb-4008-8daf-828c7aa8bd66",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "DDYPINAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.12700723327306
                },
                {
                    "sinsid": "41ecac27-4cca-414e-aded-094f28c93025",
                    "b1Name": "ERKILET",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.914468664850137
                },
                {
                    "sinsid": "9785c3ad-899e-4ffc-9226-968fc41d14ad",
                    "b1Name": "NEVSEHIR",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.301059413027913
                },
                {
                    "sinsid": "f6ad8288-d996-40b8-91e5-44d44b065839",
                    "b1Name": "NIGDECIM",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:28:00.000Z",
                    "AVG(maxValue)": 30.54
                },
                {
                    "sinsid": "768ad1f9-5890-4e95-9900-8c156f62821e",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "KAYSERI4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.916348773841962
                },
                {
                    "sinsid": "8dbcc369-ace2-43f9-a5d6-b248565a57eb",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "YAHYALI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -24.534111888111887
                },
                {
                    "sinsid": "42c17057-c20a-4a39-ba79-c7e12fb1866f",
                    "b1Name": "KALECIK",
                    "b2Name": "154",
                    "b3Name": "AKYURT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.052787878787878
                },
                {
                    "sinsid": "22b85ff6-9006-411b-898d-ff3683fd0eee",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "CIMPOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.187011572498297
                },
                {
                    "sinsid": "7ecb6381-0a0c-4f87-8c83-eafa686386ed",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "AKSURES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -29.913867132867136
                },
                {
                    "sinsid": "024ef306-29eb-4430-b10f-55a019b21fe9",
                    "b1Name": "S.KOCHIS",
                    "b2Name": "154",
                    "b3Name": "KIZILIRM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 11.452426520847569
                },
                {
                    "sinsid": "ede75dde-197d-4837-9eba-67ce832e4d72",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "KARAPIN2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:05:00.000Z",
                    "AVG(maxValue)": 11.938872180451128
                },
                {
                    "sinsid": "1e466f0d-2d3b-4772-b583-6d9bf6b304c5",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "KARAPIN1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:06:00.000Z",
                    "AVG(maxValue)": 11.667035714285714
                },
                {
                    "sinsid": "77b188e8-e917-437e-afe3-2d9c9ce0ab09",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "BASTAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.5002721088435376
                },
                {
                    "sinsid": "5c629b1a-c36d-450d-b2be-df4420cce1f6",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "KALECIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 5.943403675970048
                },
                {
                    "sinsid": "3b209f74-b2e4-4a2b-b198-a4ae7f26368d",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "LADIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 7.473963290278721
                },
                {
                    "sinsid": "6cf3554d-b0cd-42d5-86f6-cd05d8373526",
                    "b1Name": "YAZIR",
                    "b2Name": "154",
                    "b3Name": "KONYACIM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 25.30296224588577
                },
                {
                    "sinsid": "e38e8959-247a-4337-b9b6-b1e3a523fd44",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 28.768158179848314
                },
                {
                    "sinsid": "7f34cd91-219f-4c38-8126-dd04ca0e370e",
                    "b1Name": "AKDAGMDN",
                    "b2Name": "154",
                    "b3Name": "SIZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 3.8350662251655625
                },
                {
                    "sinsid": "567134c8-25aa-4071-8f91-d3783d6e340f",
                    "b1Name": "CAMINBAS",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.60102511880516
                },
                {
                    "sinsid": "61248679-2f8a-42f1-b306-1ed618837215",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "TR_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 19.88332496863237
                },
                {
                    "sinsid": "51e36798-b1d9-47c2-9fad-852b7158534b",
                    "b1Name": "KARAMANO",
                    "b2Name": "154",
                    "b3Name": "KARAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -5.9330020422055805
                },
                {
                    "sinsid": "dedae6b6-a26d-4291-b61a-f5fda3adcfa2",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "URGUP-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 12.503122017723246
                },
                {
                    "sinsid": "16f26523-4952-4b93-8142-9d7b7bb16417",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "MACUNKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.999823249490142
                },
                {
                    "sinsid": "2a97d53a-82be-40a1-806d-237b4ff9e045",
                    "b1Name": "ESMEKAYA",
                    "b2Name": "154",
                    "b3Name": "TUMOSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -8.975211171662124
                },
                {
                    "sinsid": "47acae88-20c3-448c-be12-2daccbeeb437",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "KEPEZKYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.674816076294277
                },
                {
                    "sinsid": "129be331-395d-4b83-a2e9-0832fdee5b0a",
                    "b1Name": "ESENBOGA",
                    "b2Name": "154",
                    "b3Name": "AKYURT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 8.636278911564624
                },
                {
                    "sinsid": "2c9095a2-da79-4b9b-bc55-30895b19f28d",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "ETI-SODA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 13.551966426858511
                },
                {
                    "sinsid": "7048b0c7-5ac5-460b-99e9-260773ba2930",
                    "b1Name": "BEYLIKKO",
                    "b2Name": "154",
                    "b3Name": "DDYSAZAK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:44:00.000Z",
                    "AVG(maxValue)": 4.087936507936507
                },
                {
                    "sinsid": "55129094-c7ce-4584-ad8b-815f33b33a23",
                    "b1Name": "MERAMGIS",
                    "b2Name": "154",
                    "b3Name": "ERENKOYG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 14.42858599592114
                },
                {
                    "sinsid": "32cc9deb-e940-4d8f-a7ca-3450f815ed4f",
                    "b1Name": "KPZKAYHS",
                    "b2Name": "154",
                    "b3Name": "KEPEZKAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.64618487394958
                },
                {
                    "sinsid": "8f84cc26-a735-49d1-bf9c-b7f7b9732e42",
                    "b1Name": "GURSOGUT",
                    "b2Name": "154",
                    "b3Name": "KARGIHES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 21.610342261904766
                },
                {
                    "sinsid": "89958ea6-dd7a-4c28-bf0c-dbbf9a6baec8",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "GOLBASI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -76.40791627021882
                },
                {
                    "sinsid": "8c09fae2-cd13-4829-a81b-97b9501fee56",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "380",
                    "b3Name": "GOLBASI1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -75.4667570621469
                },
                {
                    "sinsid": "c1a3f123-e019-4089-907e-84afb5f6569d",
                    "b1Name": "DAGYAKA",
                    "b2Name": "154",
                    "b3Name": "KAZAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": 2.345439560439561
                },
                {
                    "sinsid": "41f1dbb7-9114-49d7-9573-d1c6d9dfdb3f",
                    "b1Name": "KALECIK",
                    "b2Name": "154",
                    "b3Name": "KIRIKKAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -4.413589021815622
                },
                {
                    "sinsid": "cbc80bf5-6c3f-4df2-95eb-e921798fdc31",
                    "b1Name": "KALABA",
                    "b2Name": "154",
                    "b3Name": "BOGAZLYN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 6.348821007502679
                },
                {
                    "sinsid": "e120da4e-5d28-4b62-b806-a9deee090238",
                    "b1Name": "BOGAZLYN",
                    "b2Name": "154",
                    "b3Name": "SORGUN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.2831855388813103
                },
                {
                    "sinsid": "89684bd0-1d90-426e-910b-9471108edd29",
                    "b1Name": "BUSAN",
                    "b2Name": "154",
                    "b3Name": "KONYAOS2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 12.821731266149872
                },
                {
                    "sinsid": "f62a7f61-331f-446b-a535-0dee2a1f7d70",
                    "b1Name": "DDYSEKIL",
                    "b2Name": "154",
                    "b3Name": "YERKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.7427525252525253
                },
                {
                    "sinsid": "5ea79bac-4baf-41a5-a215-c1d48f93f026",
                    "b1Name": "BUSAN",
                    "b2Name": "154",
                    "b3Name": "KONYAOS1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 12.709308578745196
                },
                {
                    "sinsid": "f304753a-96de-4b56-b1ee-6f91d0f907a2",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "G4_BOR-3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 2.8017897371714646
                },
                {
                    "sinsid": "da253351-6057-4abb-8360-7e36e475f47b",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.600724538619275
                },
                {
                    "sinsid": "0f7b268d-6357-4106-b357-0c41e347af8c",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:10:00.000Z",
                    "AVG(maxValue)": 15.243373015873013
                },
                {
                    "sinsid": "2f19c0ed-535a-4815-9166-e080f2e7b6aa",
                    "b1Name": "MISLIOVA",
                    "b2Name": "154",
                    "b3Name": "DERINKUY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -16.74583276682529
                },
                {
                    "sinsid": "dd0c23fb-6a01-465d-9cfd-987e17420ad8",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": 14.79186507936508
                },
                {
                    "sinsid": "a103120e-1ba9-4c05-9e78-a32a21d8a1b6",
                    "b1Name": "SORGUN",
                    "b2Name": "154",
                    "b3Name": "BOGAZLYN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -0.2582593856655289
                },
                {
                    "sinsid": "a8a53706-4eb2-4dff-a22d-11a5a2ca21d1",
                    "b1Name": "KAYSERI4",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -32.17163207547169
                },
                {
                    "sinsid": "febc77fb-2930-4c54-9b51-763ed388e53b",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "OSTIMOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.0062338545207337
                },
                {
                    "sinsid": "5690de87-b486-42c6-9d33-c3612bacf7a9",
                    "b1Name": "CAMINBAS",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 6.13049089469517
                },
                {
                    "sinsid": "c8aef884-9d4b-46d1-8b93-e43676b4ffc6",
                    "b1Name": "SIVRIHIS",
                    "b2Name": "154",
                    "b3Name": "EMIRDAG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.13064961990325
                },
                {
                    "sinsid": "ce636122-c576-481d-8e7b-b193a846e1c8",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "HACILAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -35.48099319727891
                },
                {
                    "sinsid": "53ee1244-4060-49ee-8929-3c56775164d9",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR6",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 20.982135061391546
                },
                {
                    "sinsid": "e9a596e7-7b7a-4503-8693-898d87cde051",
                    "b1Name": "CAMINBAS",
                    "b2Name": "154",
                    "b3Name": "KUYULUKR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 5.129218218898708
                },
                {
                    "sinsid": "dd0fea7e-cd60-445e-9e2b-dde1249d6ed3",
                    "b1Name": "INCEK",
                    "b2Name": "154",
                    "b3Name": "YILDIZ",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 3.0977057356608473
                },
                {
                    "sinsid": "30e63cf7-a760-4246-b2b4-775d84714e4f",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "URGUP-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.320040844111642
                },
                {
                    "sinsid": "1bad3be4-45c4-4555-90ad-8f542a4d9112",
                    "b1Name": "KAZAN",
                    "b2Name": "154",
                    "b3Name": "UZAYOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 10.844498977505111
                },
                {
                    "sinsid": "ebda28a7-9e78-4fd1-b8bd-24eab6bb8fb5",
                    "b1Name": "OSTIMOSB",
                    "b2Name": "154",
                    "b3Name": "MACUNKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.10140231449966
                },
                {
                    "sinsid": "22b212df-2ad8-4044-8478-d5258e21e151",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "CAMLICA1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 14.628069852941175
                },
                {
                    "sinsid": "98d7f150-9284-43c2-8862-30c050edbbba",
                    "b1Name": "BOR",
                    "b2Name": "154",
                    "b3Name": "G4-BOR-3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.307108843537415
                },
                {
                    "sinsid": "efc03c8a-143e-4c20-a3da-ad1ca0d0b572",
                    "b1Name": "MENEKSER",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:10:00.000Z",
                    "AVG(maxValue)": 11.35244
                },
                {
                    "sinsid": "601508af-1b59-43a4-acdf-eff086639538",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR5",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 18.99010204081633
                },
                {
                    "sinsid": "dec614e3-c475-4538-9bf8-1db1f84215ba",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "YESILHSR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -223.02069320521622
                },
                {
                    "sinsid": "a8df8d3f-a383-43f9-8b98-63318b131746",
                    "b1Name": "AKYURT",
                    "b2Name": "154",
                    "b3Name": "ESENBOGA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -7.094381778741866
                },
                {
                    "sinsid": "3ce37be9-d68e-4ed1-818e-1f40b25225e1",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "G4_BOR-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -1.852290462427746
                },
                {
                    "sinsid": "78ebc620-13d1-46e0-8042-f32596b45f23",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 17.179467213114748
                },
                {
                    "sinsid": "84b066c1-8e44-4338-834e-21eace75b8e3",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "KNYAOSB2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.565010266940452
                },
                {
                    "sinsid": "97f196aa-d504-4055-89d4-d536606bdbe7",
                    "b1Name": "SIZIR",
                    "b2Name": "154",
                    "b3Name": "AKDAGMDN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.031845940319222
                },
                {
                    "sinsid": "b7d1bfa7-68a2-410c-becb-9e066950a6cc",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "RGKYKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:03:00.000Z",
                    "AVG(maxValue)": 5.50858695652174
                },
                {
                    "sinsid": "ca383e05-1f22-4bde-ab1a-6887cc98d3c0",
                    "b1Name": "PINARBAS",
                    "b2Name": "154",
                    "b3Name": "ELBIST-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -0.6708038147138963
                },
                {
                    "sinsid": "88a679a5-faa1-467b-babd-0e0dd3ecf949",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "CINKUR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 7.747246080436266
                },
                {
                    "sinsid": "a90d5fbc-9062-4418-9c76-702436fcc83e",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "ALCI-TEM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -36.824038069340574
                },
                {
                    "sinsid": "752192d9-54d6-44f1-bf12-6c86c23200a6",
                    "b1Name": "MENEKSER",
                    "b2Name": "154",
                    "b3Name": "BEYYURDU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": 11.278958333333334
                },
                {
                    "sinsid": "9af69c26-e734-4c06-ac46-b60668c3b490",
                    "b1Name": "ESMEKAYA",
                    "b2Name": "154",
                    "b3Name": "KIZOREN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.719571136827776
                },
                {
                    "sinsid": "f8a64114-bd8a-4927-8b71-d02af4b786fe",
                    "b1Name": "KAPULUKA",
                    "b2Name": "154",
                    "b3Name": "HACILAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.408473541383989
                },
                {
                    "sinsid": "4d2a7dfc-89d0-4627-ba3e-52284a18281b",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "KUTUKLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -6.287372742200327
                },
                {
                    "sinsid": "012b7e6d-2c68-42d2-933b-15f512d0f202",
                    "b1Name": "ESMEKAYA",
                    "b2Name": "154",
                    "b3Name": "TUZGOLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 16.159326765188837
                },
                {
                    "sinsid": "fd3f27cd-7cb7-4f4f-8423-2e8766c2f9be",
                    "b1Name": "KAZAN",
                    "b2Name": "154",
                    "b3Name": "DAGYAKA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.55162457337884
                },
                {
                    "sinsid": "0a49da56-2ca0-48a8-8d54-9aa909d08c79",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "KNYAOSB1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 3.0603210382513666
                },
                {
                    "sinsid": "c4b98ef2-d744-425f-93b2-1dcb04fb104c",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "ATAKALE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.115023761031907
                },
                {
                    "sinsid": "7f5d756e-c079-4ebf-aca5-e3bd7edf8f3f",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR7",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.39293137254902
                },
                {
                    "sinsid": "409fd207-50ca-4456-9eb7-1b4db285c2b5",
                    "b1Name": "KALECIK",
                    "b2Name": "154",
                    "b3Name": "YAKINKEN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.171721027064538
                },
                {
                    "sinsid": "d24ce31e-2abd-423d-8a74-63feb8dc88d5",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR8",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.24693805309734
                },
                {
                    "sinsid": "f452b8c1-ad90-406b-823a-f2e88be9e70a",
                    "b1Name": "KONYAOSB",
                    "b2Name": "154",
                    "b3Name": "KONYAKZ2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.559047619047618
                },
                {
                    "sinsid": "6fb1efd1-3862-425f-9618-1c50db2a6d6a",
                    "b1Name": "POLATLI",
                    "b2Name": "154",
                    "b3Name": "DDYKOCAH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -31.036341961852855
                },
                {
                    "sinsid": "9788f5bc-345c-46d9-9f2d-6d74156e7c38",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 16.04674418604651
                },
                {
                    "sinsid": "86f18091-dbca-4b45-86b8-061cdc1c7a3c",
                    "b1Name": "SORGUN",
                    "b2Name": "154",
                    "b3Name": "BEYYURDU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.115094736842103
                },
                {
                    "sinsid": "91cd017b-5034-4eb2-9856-fb728f6a5671",
                    "b1Name": "MENEKSER",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:10:00.000Z",
                    "AVG(maxValue)": 11.336041666666665
                },
                {
                    "sinsid": "bbb24868-ca72-4bad-adf0-f98eb5736eb1",
                    "b1Name": "AKYEL-2",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 9.095633514986377
                },
                {
                    "sinsid": "f9570166-51e2-4ca6-b100-b08e77fd0fb3",
                    "b1Name": "AKDAGMDN",
                    "b2Name": "154",
                    "b3Name": "ARTOVACM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -9.371568381430363
                },
                {
                    "sinsid": "f5edd006-21f9-40eb-b396-26ad3bee559d",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swPRTR3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 15.661495198902601
                },
                {
                    "sinsid": "8334cacb-afa6-4028-b6ee-c54906dfc437",
                    "b1Name": "KALECIK",
                    "b2Name": "154",
                    "b3Name": "DDYIZZET",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:43:00.000Z",
                    "AVG(maxValue)": 4.30431506849315
                },
                {
                    "sinsid": "e79dde70-a633-4524-8873-548e8ed0b154",
                    "b1Name": "KAZAN",
                    "b2Name": "154",
                    "b3Name": "KIZILCAH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 9.567857142857141
                },
                {
                    "sinsid": "a29cab1d-5038-494f-afb9-a0da8b2a11b5",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "ANKARASA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.4624285714285716
                },
                {
                    "sinsid": "e0373d07-fe5b-46fc-b038-4a38fc1fab4c",
                    "b1Name": "KONYAOSB",
                    "b2Name": "154",
                    "b3Name": "KONYAKZ1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.182107409925221
                },
                {
                    "sinsid": "992b337a-fe4d-4886-9fd9-b23f07d7dfdb",
                    "b1Name": "SARKISLA",
                    "b2Name": "154",
                    "b3Name": "PINARBAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.734342194955691
                },
                {
                    "sinsid": "1485ad5f-369f-4400-80ae-349d102a2322",
                    "b1Name": "EMIRLER",
                    "b2Name": "154",
                    "b3Name": "ASELSANM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 11.622445355191259
                },
                {
                    "sinsid": "136a9f87-5adc-4e1f-a47a-c7f099fa5dc6",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "WINDFARM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.9645641527913806
                },
                {
                    "sinsid": "8edaba4a-d0e3-42f4-bde7-0830c629a796",
                    "b1Name": "CIMPOR",
                    "b2Name": "154",
                    "b3Name": "KAYAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.934196185286103
                },
                {
                    "sinsid": "2a3dcae8-5151-4659-890b-1e8163095054",
                    "b1Name": "NIGDE",
                    "b2Name": "154",
                    "b3Name": "NIGDECIM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 11.765289957567187
                },
                {
                    "sinsid": "97acd3cf-bf35-457a-b812-95044200809a",
                    "b1Name": "ETI-SODA",
                    "b2Name": "154",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -13.464993045897081
                },
                {
                    "sinsid": "c3645fc6-4e5e-4bec-be2c-4b525964571c",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 2.5369544527532284
                },
                {
                    "sinsid": "189a6770-a56c-4330-ad0b-cf0c1be3ab83",
                    "b1Name": "BEYLIKKO",
                    "b2Name": "154",
                    "b3Name": "DDYBEYLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:44:00.000Z",
                    "AVG(maxValue)": 1.0781538461538462
                },
                {
                    "sinsid": "47bc10da-0571-4128-a374-a85e7819ec86",
                    "b1Name": "OSTIMOSB",
                    "b2Name": "154",
                    "b3Name": "ANKARASA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.1877414965986395
                },
                {
                    "sinsid": "074ffd10-363e-45f8-98ae-20e6dc2c17f4",
                    "b1Name": "YAZIR",
                    "b2Name": "154",
                    "b3Name": "MERAMGIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.8957833787465939
                },
                {
                    "sinsid": "48dd4202-e8fc-48a6-89b5-bc654963c038",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "KAYSERI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.071103542234333
                },
                {
                    "sinsid": "1e7d7775-11fb-42ef-ab93-20e1bce153da",
                    "b1Name": "KALABA",
                    "b2Name": "154",
                    "b3Name": "DDYPASAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 1.6770347003154575
                },
                {
                    "sinsid": "49477405-e7f0-421e-a3f9-aa8f730ed65a",
                    "b1Name": "NIGDEOSB",
                    "b2Name": "154",
                    "b3Name": "BOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.455802721088435
                },
                {
                    "sinsid": "749ef585-a36c-4064-a58d-bdbbf2ed94d8",
                    "b1Name": "YIBITAS",
                    "b2Name": "154",
                    "b3Name": "YOZGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -44.166486291486294
                },
                {
                    "sinsid": "ce1b72a5-47f3-404a-a9ad-d8c40afd0593",
                    "b1Name": "MERAMGIS",
                    "b2Name": "154",
                    "b3Name": "YAZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 1.6432757325319314
                },
                {
                    "sinsid": "479754c5-676e-4b47-afa0-187cf0fc79d1",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "RGKYKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:31:00.000Z",
                    "AVG(maxValue)": 3.125991525423729
                },
                {
                    "sinsid": "a9f8756c-18d1-4444-8f41-33f653e177e9",
                    "b1Name": "TEKSINGE",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": 2.175816326530612
                },
                {
                    "sinsid": "87d17289-9c3f-45dc-9699-5bf492964a4e",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "LADIK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 1.2694104803493451
                },
                {
                    "sinsid": "f7699aa1-c6ca-416e-85d9-e1b3d5325f61",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "LADIK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.8872454212454212
                },
                {
                    "sinsid": "ed3dc295-17b9-4e10-9bcb-2f0564e56ffd",
                    "b1Name": "BOGAZLYN",
                    "b2Name": "154",
                    "b3Name": "KALABA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -5.368310626702997
                },
                {
                    "sinsid": "793992b6-a182-4b67-9b44-6bf8d8e1d119",
                    "b1Name": "YAYSUNGE",
                    "b2Name": "154",
                    "b3Name": "EREGLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.232923181509175
                },
                {
                    "sinsid": "4eaa703d-4f12-4e97-9ec8-91af9f91a7ca",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "TR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:45:00.000Z",
                    "AVG(maxValue)": 6.01061224489796
                },
                {
                    "sinsid": "b8bb7948-cd8e-40ed-84cf-171d0bf3c8a8",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "YAYSUNGE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -15.823238161559887
                },
                {
                    "sinsid": "2d3ebbe3-5707-4b5a-9258-40e2108398da",
                    "b1Name": "NIGDE",
                    "b2Name": "154",
                    "b3Name": "MISLIOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -12.88477195371001
                },
                {
                    "sinsid": "9a8d3df8-54c8-42f9-9b49-7d34a18af544",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "CINKUR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.637392784206945
                },
                {
                    "sinsid": "11b30b78-2094-4b92-8508-bbd1967d44c6",
                    "b1Name": "LADIK",
                    "b2Name": "154",
                    "b3Name": "KONYAKZ2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -0.7571966527196654
                },
                {
                    "sinsid": "2d9e22f7-cc64-4faf-9e4a-e8b48b936301",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "G4_BOR-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -21.475990950226247
                },
                {
                    "sinsid": "3da760d5-2bad-4040-97bc-6258194f62ee",
                    "b1Name": "HASKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.681166439290587
                },
                {
                    "sinsid": "cefa976a-add5-4442-84ff-01c27b9b043b",
                    "b1Name": "YERKOY",
                    "b2Name": "154",
                    "b3Name": "CAYDOGAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": 0.10005241090146748
                },
                {
                    "sinsid": "989f2013-b21f-4fea-85ec-45d1cbb23cab",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "CINKUR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.18221088435374
                },
                {
                    "sinsid": "cf5bb48e-749f-4ee4-b65f-52a31adadb24",
                    "b1Name": "ADATOPRK",
                    "b2Name": "154",
                    "b3Name": "DDYCAYIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -23.801257575757578
                },
                {
                    "sinsid": "cd3a08e8-6aaa-443d-91fa-aabc9a78fd6c",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "ERKILET",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.610476514635808
                },
                {
                    "sinsid": "c4afe802-a494-475a-9c86-42f1e10c1fb4",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "SENDIREM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.716730115567639
                },
                {
                    "sinsid": "ba4a95d3-934e-4431-b674-47185978647f",
                    "b1Name": "YERKOY",
                    "b2Name": "154",
                    "b3Name": "YIBITAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.199955385595924
                },
                {
                    "sinsid": "7c48d582-ba36-45df-9ad6-0402551153a5",
                    "b1Name": "KONYAOSB",
                    "b2Name": "154",
                    "b3Name": "BUSAN2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.281772324471711
                },
                {
                    "sinsid": "50600a5c-72f0-4784-8007-328e7a5a2602",
                    "b1Name": "LADIK",
                    "b2Name": "154",
                    "b3Name": "KONYAKZ1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.81729674796748
                },
                {
                    "sinsid": "92351449-ac99-428a-807c-211c83ea9cef",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "SKOCHISA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.460047586675733
                },
                {
                    "sinsid": "c8c5d27f-afbd-47e8-8c1a-aa695ebe491f",
                    "b1Name": "DEL51",
                    "b2Name": "154",
                    "b3Name": "GenSumP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:17:00.000Z",
                    "AVG(maxValue)": 1.35
                },
                {
                    "sinsid": "3dde8451-bee4-4516-9e2b-2f26c9d8163f",
                    "b1Name": "KAYSERI4",
                    "b2Name": "154",
                    "b3Name": "URGUP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -7.482405462184874
                },
                {
                    "sinsid": "95720a48-dde5-432c-8173-b8542accb10a",
                    "b1Name": "KIRIKKAL",
                    "b2Name": "154",
                    "b3Name": "KIZILIRM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.746569094622194
                },
                {
                    "sinsid": "afe10a70-46a7-45ec-9994-668183f57993",
                    "b1Name": "CIGDEM",
                    "b2Name": "154",
                    "b3Name": "UMITKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.783394683026584
                },
                {
                    "sinsid": "fb827e66-f30e-4ef6-90b6-a28891a8e5a4",
                    "b1Name": "KAYACIK",
                    "b2Name": "154",
                    "b3Name": "BAGLAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": -22.34713692946058
                },
                {
                    "sinsid": "6d5221de-194f-4b76-aaa2-644743ada0e1",
                    "b1Name": "KONYAOSB",
                    "b2Name": "154",
                    "b3Name": "BUSAN1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.403160762942781
                },
                {
                    "sinsid": "da272915-d3df-4987-ad7c-fce319a2b88e",
                    "b1Name": "CIGDEM",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.84491769547325
                },
                {
                    "sinsid": "83e234d3-bb38-4da5-9954-e2e77abd1ceb",
                    "b1Name": "KIZOREN",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -27.08769387755101
                },
                {
                    "sinsid": "a63c9630-d012-481c-a6ae-827c41b8e51e",
                    "b1Name": "SARKISLA",
                    "b2Name": "154",
                    "b3Name": "VOTORANT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -22.251956373551465
                },
                {
                    "sinsid": "d13de74a-dc4a-41cf-a7a8-339952ed65da",
                    "b1Name": "KIRSEHIR",
                    "b2Name": "154",
                    "b3Name": "YERKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -23.122767695099814
                },
                {
                    "sinsid": "d9bd8154-7dfa-4f1c-87d3-92f9ad22ce8d",
                    "b1Name": "KULU",
                    "b2Name": "154",
                    "b3Name": "CIHANBEY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.294573960463527
                },
                {
                    "sinsid": "e2399714-87dc-415c-b4cb-f1b7469b61ef",
                    "b1Name": "BILKENTG",
                    "b2Name": "154",
                    "b3Name": "CIGDEM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:55:00.000Z",
                    "AVG(maxValue)": -16.414545454545458
                },
                {
                    "sinsid": "e9ba9a06-d349-4d68-bc8f-bbe61b3b72fc",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "KEBAN-2G",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -558.4161739130436
                },
                {
                    "sinsid": "49de0a3b-d055-4ede-8c1f-a58c7d311bc5",
                    "b1Name": "TAKSAN",
                    "b2Name": "154",
                    "b3Name": "SENDIREM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -12.407115646258502
                },
                {
                    "sinsid": "c4c01d6e-51a4-4cdc-88ef-fc8c1c4f04a6",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:27:00.000Z",
                    "AVG(maxValue)": 1.676304347826087
                },
                {
                    "sinsid": "f33a3459-c53e-4eaf-9f7c-1f4e5976abe7",
                    "b1Name": "ALTINOVA",
                    "b2Name": "154",
                    "b3Name": "KOLUKISA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -29.175475051264527
                },
                {
                    "sinsid": "721b79a8-3b4a-4ab5-a3e1-438077494044",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T17:53:00.000Z",
                    "AVG(maxValue)": 2.4217857142857144
                },
                {
                    "sinsid": "efb9b7b7-321a-40ca-a419-5e29e117757e",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.305483651226155
                },
                {
                    "sinsid": "fb8fa8a8-cbdc-4beb-a4d7-65affc5ce3e7",
                    "b1Name": "ANK-DGKC",
                    "b2Name": "154",
                    "b3Name": "swGenGT2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:17:00.000Z",
                    "AVG(maxValue)": 0.6983333333333334
                },
                {
                    "sinsid": "44d09007-1cbc-43b6-8d5e-ad65e12080d4",
                    "b1Name": "A.HOYUGU",
                    "b2Name": "154",
                    "b3Name": "CUMRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -30.02586820083682
                },
                {
                    "sinsid": "6b02021c-73ab-42ab-b282-7837eeaf5e6a",
                    "b1Name": "MAMAK",
                    "b2Name": "154",
                    "b3Name": "KAYAS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.514914675767915
                },
                {
                    "sinsid": "8ffb57c9-1efa-4301-b928-2d94fc84aabd",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "TR_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -2.9649014778325125
                },
                {
                    "sinsid": "7a9bf0f1-4473-4d9d-a9fa-b89c1adf80f0",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.3759768550034
                },
                {
                    "sinsid": "1ac733cc-c23b-472f-9dcc-7627fa5dff77",
                    "b1Name": "CINKUR",
                    "b2Name": "154",
                    "b3Name": "YAMULA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -74.13760344827584
                },
                {
                    "sinsid": "bf67e654-0ce8-4172-8d35-c4b4276f0bea",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T11:36:00.000Z",
                    "AVG(maxValue)": 2.59
                },
                {
                    "sinsid": "1a48bfaf-5ff2-4f94-b630-a35f7bb8ea87",
                    "b1Name": "YAMULAHS",
                    "b2Name": "154",
                    "b3Name": "swGTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -39.423707865168545
                },
                {
                    "sinsid": "69fc1bfc-befe-4c75-b925-cfe5a8a1a5aa",
                    "b1Name": "ANK-DGKC",
                    "b2Name": "154",
                    "b3Name": "swGenGT1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:17:00.000Z",
                    "AVG(maxValue)": -0.41875
                },
                {
                    "sinsid": "0d8385a8-bda0-46d0-95d2-c2e01c6aeec8",
                    "b1Name": "KOLUKISA",
                    "b2Name": "154",
                    "b3Name": "DDYGOZLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -37.80308396946565
                },
                {
                    "sinsid": "de857bde-90ba-49ed-a9bc-7a262ffef22c",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:58:00.000Z",
                    "AVG(maxValue)": -8.973737373737375
                },
                {
                    "sinsid": "fe5d6b03-8fa1-4068-9979-0825b8a05e1c",
                    "b1Name": "S.KOCHIS",
                    "b2Name": "154",
                    "b3Name": "ATARES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.507060027285128
                },
                {
                    "sinsid": "93fc3ebc-78ae-4966-b768-cff457a881e6",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -45.83460272011453
                },
                {
                    "sinsid": "5cf69399-fa69-45ac-8e6d-893c2693840f",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.65266348773842
                },
                {
                    "sinsid": "88c05e86-5680-486e-a84f-c9098455c06f",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.656058543226685
                },
                {
                    "sinsid": "21650183-fc0d-4828-b1db-d1b0f45538f9",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "BOSHAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:24:00.000Z",
                    "AVG(maxValue)": 1.5249999999999997
                },
                {
                    "sinsid": "7626a510-3d75-49d7-82cc-d3acef11199c",
                    "b1Name": "BOROSB",
                    "b2Name": "154",
                    "b3Name": "BOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -39.709547477744806
                },
                {
                    "sinsid": "35e45bbd-8da0-4d76-91c9-ac92987c1049",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "EREGLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -43.143523809523806
                },
                {
                    "sinsid": "cc4fc0a5-ca94-46d9-b10f-0de97255783e",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "HIRFANL1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.680968523002421
                },
                {
                    "sinsid": "f74299bb-cde7-4e6f-8200-ca95ad958439",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "YESILHSR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": 1.5064247517188694
                },
                {
                    "sinsid": "cb9f90fa-4ae0-42fd-a803-155328c2a055",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.188345813478557
                },
                {
                    "sinsid": "cfff098d-9b8f-4a3d-9c05-88016239fb87",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.188223281143634
                },
                {
                    "sinsid": "7688dc36-66ed-4f3f-8a68-9649e13bb125",
                    "b1Name": "CEKERKHV",
                    "b2Name": "154",
                    "b3Name": "KARALIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -18.566841692789968
                },
                {
                    "sinsid": "ad24945c-e93a-4acc-a523-c1e952373737",
                    "b1Name": "KARALIKR",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -17.87430016863406
                },
                {
                    "sinsid": "d75a2825-852a-4024-8aeb-ecba8d458b28",
                    "b1Name": "KARALIKR",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -17.874300168634065
                },
                {
                    "sinsid": "d780a641-32ce-4d89-8a24-31034c917510",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "CAMINBAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -4.4470816326530604
                },
                {
                    "sinsid": "4607bfe0-a10f-4877-8031-7f5bc238579b",
                    "b1Name": "CAMINBAS",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -4.42204344874406
                },
                {
                    "sinsid": "25e32d5d-c71d-4beb-8c37-26be8ae5619f",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "swGTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:19:00.000Z",
                    "AVG(maxValue)": 0.7716666666666666
                },
                {
                    "sinsid": "b3a56953-07cb-485a-8df4-390926ff8837",
                    "b1Name": "KEPEZKAY",
                    "b2Name": "154",
                    "b3Name": "AYBASTI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -33.07516218081436
                },
                {
                    "sinsid": "f1357ef9-f4c4-436a-8516-d2926ae5106b",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -38.97383570943653
                },
                {
                    "sinsid": "e41fe909-7799-4490-926a-7af511b6a60d",
                    "b1Name": "ANK-DGKC",
                    "b2Name": "154",
                    "b3Name": "swGenST",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 1.11
                },
                {
                    "sinsid": "4ed9bbb3-fe69-42f0-b235-e40bdda415c0",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "BEYPAZAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -11.185463756819955
                },
                {
                    "sinsid": "73bc3d53-1d56-42da-a365-8424740407ff",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "B.HACILI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T20:49:00.000Z",
                    "AVG(maxValue)": -19.246538461538464
                },
                {
                    "sinsid": "86cd9d0d-e5c9-48b4-b3bd-92bff3f9a74c",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "swGTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:19:00.000Z",
                    "AVG(maxValue)": 0.5005128205128205
                },
                {
                    "sinsid": "014c76b0-4515-4bab-b50f-1c198cd5a42d",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "CAMLICA3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.75402035623409
                },
                {
                    "sinsid": "012cb66d-f2ae-417a-8ce3-de73ac25c252",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "ANKDG-G1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:37:00.000Z",
                    "AVG(maxValue)": 0.7076288659793815
                },
                {
                    "sinsid": "6be64983-3768-4878-8fa3-007f59afd46d",
                    "b1Name": "KARATAY",
                    "b2Name": "380",
                    "b3Name": "MERSIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T06:20:00.000Z",
                    "AVG(maxValue)": 0.36
                },
                {
                    "sinsid": "d157028e-cc8b-4e9e-8d03-de55d785bf15",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:13:00.000Z",
                    "AVG(maxValue)": -20.093624823695347
                },
                {
                    "sinsid": "f5ad9011-e8aa-48db-b91b-4140ebc1d722",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "swTR_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:13:00.000Z",
                    "AVG(maxValue)": -10.276487341772151
                },
                {
                    "sinsid": "13bd0a22-1695-453a-a818-c61708ffac6f",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "K.A.GES1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:51:00.000Z",
                    "AVG(maxValue)": -7.700560975609756
                },
                {
                    "sinsid": "e0e9cad9-f148-4bc7-aad4-baea96b5f583",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "URGUP1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -22.931130020422057
                },
                {
                    "sinsid": "e689bf6f-2b3d-49fe-a4a9-f8e7eddb430c",
                    "b1Name": "KARAPINA",
                    "b2Name": "154",
                    "b3Name": "K.A.GES2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -6.475125
                },
                {
                    "sinsid": "e89de3e6-9772-4608-94d8-c83002e195eb",
                    "b1Name": "LADIK",
                    "b2Name": "154",
                    "b3Name": "KUYULUKO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -7.851255813953489
                },
                {
                    "sinsid": "7e4e9290-288f-4661-8f15-d7e6ffdf95bb",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "swTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T08:49:00.000Z",
                    "AVG(maxValue)": 0.65
                },
                {
                    "sinsid": "dece3563-3a4c-406d-8a67-55bf4a3f07d8",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -5.524044233807267
                },
                {
                    "sinsid": "8b70a68c-42f6-45b5-a368-a84925da9ae7",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.125346467391303
                },
                {
                    "sinsid": "19b153eb-6e05-450f-8130-f73663a291f0",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "swGTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -96.71608635097492
                },
                {
                    "sinsid": "4907bed6-e360-4b92-8881-23fcf564cd10",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.808004073319754
                },
                {
                    "sinsid": "433ac9e4-119f-4b93-b1b9-a8eb79923410",
                    "b1Name": "KAPULUKA",
                    "b2Name": "154",
                    "b3Name": "swTR3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.18495587236931432
                },
                {
                    "sinsid": "bd6da6ca-db47-4d12-a94c-35d5ccbf7823",
                    "b1Name": "KAPULUKA",
                    "b2Name": "154",
                    "b3Name": "swTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.7638017651052273
                },
                {
                    "sinsid": "476fc96b-62f5-40b6-85bb-6b67bcc63586",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "swGTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -14.868881818181817
                },
                {
                    "sinsid": "ebd7d412-fb69-4c43-9be3-611e8d21f91e",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "swGTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -11.48427689594356
                },
                {
                    "sinsid": "472f5afd-f7e7-4efb-aa8f-cacf6d235b78",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.4615625
                },
                {
                    "sinsid": "a1fc1792-22df-4bc1-a1d1-b246c13d91fa",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -3.2213389513108615
                },
                {
                    "sinsid": "a8877c91-567a-462c-86ba-515a21f49df8",
                    "b1Name": "KAPULUKA",
                    "b2Name": "154",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": 0.14048168249660786
                },
                {
                    "sinsid": "c140c5f5-5b4e-4520-8d4f-9ec1cdff2892",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -17.138411724608044
                },
                {
                    "sinsid": "691de3a9-1373-4cc6-88c2-bf74d3dd7d7b",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "swGTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -15.14850492390331
                },
                {
                    "sinsid": "d4db714f-285b-4057-a192-d94e927a9f89",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "swTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -17.48225476839237
                },
                {
                    "sinsid": "def8c6e7-9da1-45ff-8d3d-8d5f2823a400",
                    "b1Name": "K.PINARG",
                    "b2Name": "380",
                    "b3Name": "swGTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:41:00.000Z",
                    "AVG(maxValue)": -16.965550755939528
                },
                {
                    "sinsid": "f7eb94f5-dfec-419d-9d4f-a701d17a0137",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "swGTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -2.8177155824508313
                },
                {
                    "sinsid": "df2a8209-e58d-449c-a665-e7fc323b191e",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "HIRFANL2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -6.770178970917227
                },
                {
                    "sinsid": "4ba93890-d444-482f-89b8-6729327fac29",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.691464577656676
                },
                {
                    "sinsid": "c3cbeb6a-0604-4bd8-9c94-0c7eb1997fd6",
                    "b1Name": "K.PINARG",
                    "b2Name": "154",
                    "b3Name": "swTR_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:13:00.000Z",
                    "AVG(maxValue)": -10.782055016181229
                },
                {
                    "sinsid": "ea9c8341-6ef8-4c25-9b7b-ad0b411a4279",
                    "b1Name": "MAVIHES",
                    "b2Name": "154",
                    "b3Name": "GUNEYSIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": 0.07884228187919463
                },
                {
                    "sinsid": "d9bfdfac-d666-4e8a-b5a0-e2cd889ba37c",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:17:00.000Z",
                    "AVG(maxValue)": -12.094756756756755
                },
                {
                    "sinsid": "0fbb8bac-96a4-43ca-a1e8-d00333dc42fb",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -5.9322763237979315
                },
                {
                    "sinsid": "50c83aa6-099f-4b16-8236-14b55d77375f",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "GEYCEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:37:00.000Z",
                    "AVG(maxValue)": -49.20654247391952
                },
                {
                    "sinsid": "d5bb028a-8167-4384-bf28-f803f81b0e70",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -35.1945417515275
                },
                {
                    "sinsid": "eeedd74d-83d9-42f9-9ecb-69da8c2ae393",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -10.388816388467374
                },
                {
                    "sinsid": "16494384-22e9-4ba5-b5f7-1ba3915b02c2",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "swTR_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -17.68087091757387
                },
                {
                    "sinsid": "42e94846-3784-4acd-9e55-e954be65285a",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -24.562251184834125
                },
                {
                    "sinsid": "4b21c2bd-3b82-401c-abb8-db6eb792c5ce",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "YAHYALI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.137002039428959
                },
                {
                    "sinsid": "fd5b471b-3f31-4550-bb09-302f87143786",
                    "b1Name": "IGAGES",
                    "b2Name": "400",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:05:00.000Z",
                    "AVG(maxValue)": -11.09579268292683
                },
                {
                    "sinsid": "ff675594-1fcb-4c83-a0e8-7889ac039586",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "KURTKAYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -19.43213943950786
                },
                {
                    "sinsid": "401cff12-55bb-4ecf-9c19-ddf0fd7bc5ce",
                    "b1Name": "KESIKKOP",
                    "b2Name": "154",
                    "b3Name": "KIZ-KIRI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:39:00.000Z",
                    "AVG(maxValue)": 0.2129230769230769
                },
                {
                    "sinsid": "43d5b36b-f2e0-4cee-a3e0-a157460d2e4e",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -4.246949999999999
                },
                {
                    "sinsid": "e7ce25b7-2ece-4a1c-9c61-9f8d1781079b",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.313983628922237
                },
                {
                    "sinsid": "cbab4d90-3ef9-4ee6-988d-4b48a20178c5",
                    "b1Name": "G4_BOR-3",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -3.3578532110091737
                },
                {
                    "sinsid": "1d84d809-691a-46b9-a6a6-c92f92f3281a",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "swTR_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.575446735395193
                },
                {
                    "sinsid": "914877e7-09d1-4e02-969a-8c014328c904",
                    "b1Name": "TEKSINGE",
                    "b2Name": "154",
                    "b3Name": "swTR-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -1.3108352144469526
                },
                {
                    "sinsid": "0f48ccc6-4d69-4957-ace6-496d19d3490a",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": -14.02824074074074
                },
                {
                    "sinsid": "3b0c7606-0c63-4445-b705-45d1304bb6aa",
                    "b1Name": "KUYULUKO",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.0059211420802168
                },
                {
                    "sinsid": "4a013965-ff69-4383-8745-bf896a4b0fb0",
                    "b1Name": "SARIYAR",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:10:00.000Z",
                    "AVG(maxValue)": 0.16
                },
                {
                    "sinsid": "8d8bd25e-4123-420b-b429-dcf3ec7de7bb",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": -14.02824074074074
                },
                {
                    "sinsid": "15f7ccbd-9a14-4a2b-a8bf-a3ca99cf1717",
                    "b1Name": "G4_BOR-2",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -2.779776223776224
                },
                {
                    "sinsid": "235415ba-e096-4ab2-b7a5-c7adc59ac490",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:18:00.000Z",
                    "AVG(maxValue)": -5.408636363636364
                },
                {
                    "sinsid": "d6d3b844-7e6c-4b9a-ab9d-2ea1608def07",
                    "b1Name": "BEYYURDU",
                    "b2Name": "154",
                    "b3Name": "MNKSERES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": -11.18586956521739
                },
                {
                    "sinsid": "e389b1e0-ad73-48dc-a646-bfb38ac29276",
                    "b1Name": "G4BOR-1",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -5.981148514851484
                },
                {
                    "sinsid": "31ff26ce-b9d4-48c2-a238-d0780fccab74",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.776476608187135
                },
                {
                    "sinsid": "3e190728-d112-4f4e-ae50-e0f7da232bc6",
                    "b1Name": "MENEKSER",
                    "b2Name": "154",
                    "b3Name": "swTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:59:00.000Z",
                    "AVG(maxValue)": -10.187010309278351
                },
                {
                    "sinsid": "6f89c0aa-6c8a-438c-a485-1be5a241a478",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -15.774886613021215
                },
                {
                    "sinsid": "bc98162e-8d08-4062-b7ad-9e10e7d2e304",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "swTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.38624847001224
                },
                {
                    "sinsid": "65353f8f-2377-4c2c-aa10-7828551cf058",
                    "b1Name": "R3KRMN1R",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -48.503789260385005
                },
                {
                    "sinsid": "0aad3d56-109c-4146-873c-d31d385e7822",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:20:00.000Z",
                    "AVG(maxValue)": -2.2494
                },
                {
                    "sinsid": "6db1c272-4950-45e0-af82-3315bf3557c9",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "swGTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:00:00.000Z",
                    "AVG(maxValue)": -7.264541832669323
                },
                {
                    "sinsid": "02a453bd-e21e-4182-b3a0-81671c929051",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "KAYSERI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -31.023904653802493
                },
                {
                    "sinsid": "03ba28a5-663c-4713-b8f0-fca8d1067f5f",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "swSTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:26:00.000Z",
                    "AVG(maxValue)": -1.1286486486486487
                },
                {
                    "sinsid": "06ac7257-92aa-4ca6-9f4c-23730fcdc1d5",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "MAMAK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:59:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "07a25fbf-d437-4a22-b99c-f68a24f567e2",
                    "b1Name": "POLATCMT",
                    "b2Name": "154",
                    "b3Name": "YEDEK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:22:00.000Z",
                    "AVG(maxValue)": -274.9701234567901
                },
                {
                    "sinsid": "07caeeef-a70e-44a0-889c-97292d69e646",
                    "b1Name": "KARGIHS",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "085b8249-e3b5-4eb3-a878-8f6089cb8cde",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "YEDEK2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:36:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "096bc8ac-2239-41a0-b934-52eed11760ed",
                    "b1Name": "YAHYALBE",
                    "b2Name": "154",
                    "b3Name": "YEDEK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:49:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "09a5262b-7eae-4857-8bee-6a0b0b8b6652",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:02:00.000Z",
                    "AVG(maxValue)": -9.319876543209874
                },
                {
                    "sinsid": "09be7bfb-d7eb-459b-9cad-f2226ff35ae3",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:58:00.000Z",
                    "AVG(maxValue)": -10.452974683544301
                },
                {
                    "sinsid": "0ca480d6-2e7e-4dba-93cc-a4c965f3eae7",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "TR_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "13e32871-8d29-4608-bced-7d04c022a4c2",
                    "b1Name": "BUSAN",
                    "b2Name": "154",
                    "b3Name": "HOTAMIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.860299931833676
                },
                {
                    "sinsid": "23628797-fc51-4504-9316-20de316e7736",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "URGUP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:21:00.000Z",
                    "AVG(maxValue)": -219.52285714285716
                },
                {
                    "sinsid": "2770ff8a-89eb-4d5a-9432-cc102c8add52",
                    "b1Name": "BILKENTG",
                    "b2Name": "154",
                    "b3Name": "UMITKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:56:00.000Z",
                    "AVG(maxValue)": -38.08549999999999
                },
                {
                    "sinsid": "2ce14d5b-cf09-4eba-b4a4-6718f78ba3db",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -204.888
                },
                {
                    "sinsid": "30728d8e-19d0-4780-b549-c9179796476a",
                    "b1Name": "NIGDECIM",
                    "b2Name": "154",
                    "b3Name": "NIGDETM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:48:00.000Z",
                    "AVG(maxValue)": -9.293047337278107
                },
                {
                    "sinsid": "453ae384-bb73-4176-810e-fe83039d10e7",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "swTR_MBL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:49:00.000Z",
                    "AVG(maxValue)": -41.85
                },
                {
                    "sinsid": "48d87d71-7ed7-4ae5-88a0-e324067272f8",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "BOZOK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -336.35569913211185
                },
                {
                    "sinsid": "4e286c6b-b217-4783-a98c-758d0d0495af",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "swGTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:26:00.000Z",
                    "AVG(maxValue)": -0.7294736842105264
                },
                {
                    "sinsid": "4e2e44e2-03bd-4ebc-be6f-d08959f88a5a",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "ICANADOL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -135.54524846834582
                },
                {
                    "sinsid": "57b86190-e33c-49a9-9548-d73c8eb40f09",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "swSTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -1.327142857142857
                },
                {
                    "sinsid": "58b4d0e9-eb7f-4209-85ad-68766c0bbf6b",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:21:00.000Z",
                    "AVG(maxValue)": -219.52285714285716
                },
                {
                    "sinsid": "5ee118b3-261c-4bbb-be42-af7a861bdb3f",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "swOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -192.00799999999998
                },
                {
                    "sinsid": "60b4260a-658a-4b0a-96a7-0472d45a34ea",
                    "b1Name": "K.HAMAM",
                    "b2Name": "154",
                    "b3Name": "KAZAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:20:00.000Z",
                    "AVG(maxValue)": -2.3180132450331126
                },
                {
                    "sinsid": "613df61e-4e0b-4bc0-a78f-c60d51f078dd",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "EMIRLER2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -153.648
                },
                {
                    "sinsid": "64bdf9df-6941-4895-9d9b-f81c56e12514",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "swGTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:26:00.000Z",
                    "AVG(maxValue)": -1.4972222222222225
                },
                {
                    "sinsid": "71303b53-60d8-4102-af32-98502cf2a076",
                    "b1Name": "YAMULAHS",
                    "b2Name": "154",
                    "b3Name": "swGTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -39.1148132780083
                },
                {
                    "sinsid": "75d433bc-4076-4003-8718-8a5c3ecfef79",
                    "b1Name": "HOTAMIS",
                    "b2Name": "154",
                    "b3Name": "KARAPINA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.365794137695975
                },
                {
                    "sinsid": "771b84d0-2a37-49a1-9627-2643eb56eff6",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "KAYABASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -308.50982315112543
                },
                {
                    "sinsid": "77fc04bd-dc2c-4c89-8401-d7e0f065d6bd",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "Tran_B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "79635a0c-887c-48f6-bfa4-0555560ff340",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "MACUNKO1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -25.19619668246446
                },
                {
                    "sinsid": "7ac1c0da-9fa9-4250-92a7-e66ef6922dd2",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "swOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -192.00799999999998
                },
                {
                    "sinsid": "7b5f9c93-71dd-4f59-a859-b1977221740e",
                    "b1Name": "MAMAK",
                    "b2Name": "154",
                    "b3Name": "KAYAS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:14:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "7e7cf896-0809-448c-81fc-c8ca9b21b0ae",
                    "b1Name": "KONYAKZY",
                    "b2Name": "380",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:50:00.000Z",
                    "AVG(maxValue)": -0.10103448275862069
                },
                {
                    "sinsid": "7ecddb2b-c4e3-45dd-8c41-f52edf18732c",
                    "b1Name": "MAVIHES",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T16:40:00.000Z",
                    "AVG(maxValue)": -0.5463779527559055
                },
                {
                    "sinsid": "8437775c-10d7-4e24-80ec-48605d7b502f",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "G.KAYSER",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -513.9543167912984
                },
                {
                    "sinsid": "8e502489-ad06-410b-a16a-32d997901f3f",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -288.7575
                },
                {
                    "sinsid": "9457e46c-ac20-4975-8eed-97d71eb890e4",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:59:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "9726946d-5027-43b7-895f-f6fe1555388b",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "97a1da87-aacf-4666-8918-d8f44c758996",
                    "b1Name": "BILKENTG",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T09:55:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "996e4935-e681-4af3-a9cc-c0c4ef05a116",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "YAHYALI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "999a1ca1-044d-4481-b973-66e6eff7d37e",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "TR_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "9c485c4f-28ec-40d4-8053-f713fd611c18",
                    "b1Name": "KPZKAYHS",
                    "b2Name": "154",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -13.42406538139145
                },
                {
                    "sinsid": "a113e68a-2a12-42b8-a9ad-309584fb7bf2",
                    "b1Name": "ICANADOL",
                    "b2Name": "380",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "a3ebcec3-9574-404c-b401-ebfbf08c7655",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "SINCAN-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "a4933ca3-22b4-4185-b7d5-c6120a937bb0",
                    "b1Name": "MERAMGIS",
                    "b2Name": "154",
                    "b3Name": "SEYDISEH",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.530061182868792
                },
                {
                    "sinsid": "a5f1edc4-e547-465c-970a-ef9ed389470d",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "GOLBASI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:59:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "a8d27d6e-ec04-41d7-86da-ae278a230dae",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:26:00.000Z",
                    "AVG(maxValue)": -3.3736538461538457
                },
                {
                    "sinsid": "aafc7e9b-fbd4-4f28-831b-3e458e00dee9",
                    "b1Name": "B.HACILI",
                    "b2Name": "154",
                    "b3Name": "YEDEK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:36:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "ac473194-c2d2-4ca6-aef9-37cf07792698",
                    "b1Name": "POLATCMT",
                    "b2Name": "154",
                    "b3Name": "YEDEK1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:22:00.000Z",
                    "AVG(maxValue)": -274.97012345679013
                },
                {
                    "sinsid": "afb5aed8-4cb0-472a-b282-064ea7f315ca",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "GEYCEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:21:00.000Z",
                    "AVG(maxValue)": -0.13714285714285715
                },
                {
                    "sinsid": "b0f95830-07f8-4541-b3d2-ccaeb5f37f77",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "b24dada5-d918-4106-9236-c8deba6dcf0a",
                    "b1Name": "ADATOPRK",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:20:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "b34ea654-fa18-4cd2-b5e4-9691caa9afa2",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -192.0825
                },
                {
                    "sinsid": "b55a3335-882b-4923-bcdf-dd3f91676b64",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "K.KAYSER",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -514.5766281441198
                },
                {
                    "sinsid": "b61ec865-84c6-4be6-a3d0-ac48fa297251",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "ba50b595-6dad-4a1a-9543-758d7c0aabe3",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "be31dbb5-2543-4a5e-8b69-0020496b3830",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "SARIYAR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:34:00.000Z",
                    "AVG(maxValue)": -19.104
                },
                {
                    "sinsid": "c6380ab1-0999-4755-b5ca-d2283bffcf5e",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "Tran_A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "c6fe398e-facf-4348-ac13-59b84faaf38d",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -288.7575
                },
                {
                    "sinsid": "c77849df-26a9-4342-a836-cb65c3fc1c41",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "c9de1f4e-13bc-4dca-90d5-a6cb5891419e",
                    "b1Name": "KIRIKDG",
                    "b2Name": "380",
                    "b3Name": "ICANADOL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -204.44073341094298
                },
                {
                    "sinsid": "cc1f8260-52f1-4cd1-9169-1f520e040b82",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "cf6c235a-de30-4bb8-8cdf-720a7fbc604e",
                    "b1Name": "KPZKAYHS",
                    "b2Name": "154",
                    "b3Name": "swTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -12.219277108433737
                },
                {
                    "sinsid": "d27f165f-07dc-446f-8576-6ff7bdbf2803",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -480.135
                },
                {
                    "sinsid": "d8bebd4e-e073-43d6-8b78-21740f69e388",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -480.135
                },
                {
                    "sinsid": "da07432c-b037-43e0-a895-9ca385d6c5a8",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "EMIRLER1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -144.04500000000002
                },
                {
                    "sinsid": "dd31a7c8-cd8c-4bb1-bbb5-d2dc9aa219ca",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "Plnt_avP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "dd51a93a-57d8-49f7-a872-58b708ccf770",
                    "b1Name": "GOLBASI",
                    "b2Name": "154",
                    "b3Name": "BOSHAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": -308.008
                },
                {
                    "sinsid": "e07c7742-25df-4510-a7a7-610aff718882",
                    "b1Name": "YAHYALI",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "e50c53dc-ded4-4ce0-a369-aef0f45b5af3",
                    "b1Name": "ADATOPRK",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:20:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "e791cef4-465d-49d8-b5fc-f7213fe56107",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "YEDEK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "ebee59ea-62d4-4cb2-a14c-e7abea4f7e8d",
                    "b1Name": "GOKCEKAY",
                    "b2Name": "380",
                    "b3Name": "GOLBASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -517.8582576271187
                },
                {
                    "sinsid": "eda59a30-7091-4d64-8888-5322eb219d0b",
                    "b1Name": "KARGIHS",
                    "b2Name": "154",
                    "b3Name": "GURSOGUT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:20:00.000Z",
                    "AVG(maxValue)": -20.630277777777778
                },
                {
                    "sinsid": "eec14ca8-fcbb-4ee3-8e58-6f3a442aa550",
                    "b1Name": "CAMLICA3",
                    "b2Name": "154",
                    "b3Name": "YEDEK-3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "f7d1de39-fba8-4c60-b1af-3763f1a495d4",
                    "b1Name": "AVANOS-2",
                    "b2Name": "154",
                    "b3Name": "YEDEK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:21:00.000Z",
                    "AVG(maxValue)": -219.52285714285716
                },
                {
                    "sinsid": "f9b2153e-cca9-4fc5-a8b9-341f22c2c7a2",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "SARIYAR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T18:38:00.000Z",
                    "AVG(maxValue)": -21.904285714285713
                },
                {
                    "sinsid": "fadb28db-0f04-43a7-8e62-4b223ccf43dc",
                    "b1Name": "KURTKAYA",
                    "b2Name": "154",
                    "b3Name": "swYEDTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "fb896e67-e5d2-47db-a01c-9575c67d17c1",
                    "b1Name": "GOLBASI",
                    "b2Name": "400",
                    "b3Name": "G.KAYA-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:48:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "fbdb8c3f-6588-447c-b3b9-89a4de6b3664",
                    "b1Name": "BILKENTG",
                    "b2Name": "154",
                    "b3Name": "BALGAT",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T09:55:00.000Z",
                    "AVG(maxValue)": 0.0
                },
                {
                    "sinsid": "2ba1f424-0765-4c27-bd43-eb34e93065e8",
                    "b1Name": "CAMLICA",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -82.49771159874608
                },
                {
                    "sinsid": "3ffbe598-8d3e-4fed-a316-325ce5b76aac",
                    "b1Name": "K.EREGLI",
                    "b2Name": "400",
                    "b3Name": "ADA-SEYD",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -43.781493506493504
                },
                {
                    "sinsid": "419cb7cc-247e-4466-a0c5-85e69979b0aa",
                    "b1Name": "CAMLICAH",
                    "b2Name": "154",
                    "b3Name": "swTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -27.723848396501456
                },
                {
                    "sinsid": "48bfe37a-5fee-4469-bb34-1ff2c35faf8c",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -14.025366726296959
                },
                {
                    "sinsid": "5301ae13-b799-4229-93e2-0f7d3febea23",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -24.732995169082127
                },
                {
                    "sinsid": "76abfc04-665c-4b3a-a85d-18cbadc4d8a3",
                    "b1Name": "CAMLICAH",
                    "b2Name": "154",
                    "b3Name": "swTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -27.765763157894735
                },
                {
                    "sinsid": "7fc03334-63b4-46e3-a862-494f60fb7a48",
                    "b1Name": "AKSURES",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -12.006318681318682
                },
                {
                    "sinsid": "b19678ea-4f76-4cbc-b3cc-3297ad627ce9",
                    "b1Name": "CAMLICAH",
                    "b2Name": "154",
                    "b3Name": "swTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -26.668037634408602
                },
                {
                    "sinsid": "31461d1e-508c-4def-ad8d-5ecd65fddcaa",
                    "b1Name": "YAYSUNGE",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T17:39:00.000Z",
                    "AVG(maxValue)": -1.180473372781065
                },
                {
                    "sinsid": "deaffdb3-5c6c-47e0-9b6a-a949e669e31e",
                    "b1Name": "YAYSUNGE",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T17:38:00.000Z",
                    "AVG(maxValue)": -1.3408333333333333
                },
                {
                    "sinsid": "76be9275-161a-41df-bcec-2092cbe97520",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -17.637773995915587
                },
                {
                    "sinsid": "69791b20-585e-40eb-ac4a-b43e513233da",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swSUTR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T20:21:00.000Z",
                    "AVG(maxValue)": -0.064
                },
                {
                    "sinsid": "587737b4-8096-4911-adf3-3871a6a20cd2",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "swTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:41:00.000Z",
                    "AVG(maxValue)": -4.7495199999999995
                },
                {
                    "sinsid": "88ae4ec7-20cc-4995-b1cd-152001ffbe07",
                    "b1Name": "R3ANKARA",
                    "b2Name": "154",
                    "b3Name": "swTR-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:47:00.000Z",
                    "AVG(maxValue)": -21.73936170212766
                },
                {
                    "sinsid": "8343ab0d-cd5b-4a30-bb8e-9767fa108c1d",
                    "b1Name": "YOZGAT",
                    "b2Name": "154",
                    "b3Name": "BOZOK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.019468664850134
                },
                {
                    "sinsid": "8d3661d5-0749-4d88-94d9-efa84fa24178",
                    "b1Name": "GEYCEK",
                    "b2Name": "154",
                    "b3Name": "AVANOS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -0.47022393282015384
                },
                {
                    "sinsid": "dbbcbec0-2d26-4c32-9ed3-2bb6a2f2cec2",
                    "b1Name": "YOZGAT",
                    "b2Name": "154",
                    "b3Name": "BOZOK-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -34.809469026548676
                },
                {
                    "sinsid": "878de531-229a-433b-a6fd-756ab32adcb0",
                    "b1Name": "SARIYAR",
                    "b2Name": "154",
                    "b3Name": "YEDEK-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T15:10:00.000Z",
                    "AVG(maxValue)": -0.16
                },
                {
                    "sinsid": "33d877d5-ce4e-4176-a3e0-f4e1b8d7b5f0",
                    "b1Name": "PETLAS",
                    "b2Name": "154",
                    "b3Name": "AVANOS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -51.50118707738542
                },
                {
                    "sinsid": "a161af43-7e4a-430a-9a08-b994cb0e058d",
                    "b1Name": "KULU",
                    "b2Name": "154",
                    "b3Name": "KIZILIRM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -39.36787755102041
                },
                {
                    "sinsid": "de3354f1-f427-4adb-99c9-5fc97eca7030",
                    "b1Name": "TAKSAN",
                    "b2Name": "154",
                    "b3Name": "CINKUR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T21:29:00.000Z",
                    "AVG(maxValue)": -0.24315068493150693
                },
                {
                    "sinsid": "9ad38e04-9655-4862-b838-6d8160cdaad1",
                    "b1Name": "KEPEZKAY",
                    "b2Name": "154",
                    "b3Name": "KEPEZHES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:44:00.000Z",
                    "AVG(maxValue)": -15.641405082212257
                },
                {
                    "sinsid": "f8aff3fb-57b2-446a-8a24-aca17de206e1",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "ERYAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.556548672566368
                },
                {
                    "sinsid": "92ceb326-6f30-4730-9310-dc3fa4dbb5c0",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "sOTR-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.88078284547311
                },
                {
                    "sinsid": "aa02ca1b-e4da-4f63-a781-7af0d22cc8c2",
                    "b1Name": "CIGDEM",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.142176870748298
                },
                {
                    "sinsid": "d296fc33-e633-4e90-b078-6d426017e275",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "sOTR-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.88078284547311
                },
                {
                    "sinsid": "ec3f61c7-6cb2-469c-ad0a-5a34e37dd907",
                    "b1Name": "KIRDEMIR",
                    "b2Name": "154",
                    "b3Name": "HACILAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.95007457121551
                },
                {
                    "sinsid": "0228b255-d3fc-4808-bd05-a3bb0c742d96",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "URGUP2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.35074931880109
                },
                {
                    "sinsid": "921e3feb-a969-42d0-bb6c-a985ebfa0197",
                    "b1Name": "YENICE",
                    "b2Name": "154",
                    "b3Name": "swGTR3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -2.744496551724138
                },
                {
                    "sinsid": "7d9d71ec-d4b6-42d6-ad74-13cd06c07509",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -71.73464406779661
                },
                {
                    "sinsid": "95f024c2-bec9-415e-8d86-4903871383ed",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -71.73464406779661
                },
                {
                    "sinsid": "16153966-ca85-4103-b086-0e631e48ee4a",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -43.76110959836623
                },
                {
                    "sinsid": "a188ae2c-51ec-4a87-82bd-65364cf60f2e",
                    "b1Name": "ERENKOY",
                    "b2Name": "154",
                    "b3Name": "MERAMGIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -12.796591683708247
                },
                {
                    "sinsid": "7d88f129-c757-4ef9-a959-1f6d8ed017d3",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "swGTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -112.30208623087623
                },
                {
                    "sinsid": "9c90613c-ea5b-4bac-b4a5-1421304537e5",
                    "b1Name": "UZAYOSB",
                    "b2Name": "154",
                    "b3Name": "KAZAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -10.72540632054176
                },
                {
                    "sinsid": "184f4c2c-c54a-489b-8986-4d4ec16f1874",
                    "b1Name": "GUNEYSNR",
                    "b2Name": "154",
                    "b3Name": "MAVIHES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -1.277413972888426
                },
                {
                    "sinsid": "b3eb4f2b-93ef-488c-8be8-d9d914114fc0",
                    "b1Name": "ORTAKOY",
                    "b2Name": "154",
                    "b3Name": "TUMOSAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -19.972009569377988
                },
                {
                    "sinsid": "c215304b-739f-417b-9918-42ecc0b21ae0",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -40.153732590529245
                },
                {
                    "sinsid": "1509ee9a-550c-4461-b18d-f4bd91482503",
                    "b1Name": "KAYACIK",
                    "b2Name": "154",
                    "b3Name": "KARATAY1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -16.927612732095486
                },
                {
                    "sinsid": "91bd5d9e-a7e9-4e63-87d9-d9b3b314f1ff",
                    "b1Name": "HACILAR",
                    "b2Name": "154",
                    "b3Name": "KAPULUKA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:36:00.000Z",
                    "AVG(maxValue)": -6.414157303370787
                },
                {
                    "sinsid": "f9fd468e-f96d-4ebf-bad2-b64ac92f59c8",
                    "b1Name": "EMIRLER",
                    "b2Name": "154",
                    "b3Name": "GOLBASI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T19:23:00.000Z",
                    "AVG(maxValue)": -1.25
                },
                {
                    "sinsid": "874796a7-2e8f-456b-8613-70141a30abba",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "ANKDG-ST",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T20:29:00.000Z",
                    "AVG(maxValue)": -1.56
                },
                {
                    "sinsid": "b6a23955-c263-4245-80e4-5f4b1637439c",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "ANKDG-G2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T22:09:00.000Z",
                    "AVG(maxValue)": -1.5747037701974869
                },
                {
                    "sinsid": "5db01c3c-01c2-4749-910b-1ecb9096411a",
                    "b1Name": "KAYACIK",
                    "b2Name": "154",
                    "b3Name": "KARATAY2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -17.236565874730022
                },
                {
                    "sinsid": "a0f0bcbd-f5f6-42ba-9ca1-461b8bcd91e8",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T11:37:00.000Z",
                    "AVG(maxValue)": -1.61
                },
                {
                    "sinsid": "72f86d49-58c0-4956-944a-3ba528a3d07b",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.362544080604533
                },
                {
                    "sinsid": "9daa9622-0dcc-42b2-af3b-afb27245abec",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.362544080604534
                },
                {
                    "sinsid": "59d6d7e0-49c8-4893-a0d5-2d82ce985a00",
                    "b1Name": "DAGYAKA",
                    "b2Name": "154",
                    "b3Name": "BAGLUM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -19.05890134529148
                },
                {
                    "sinsid": "2d5107b8-9dc7-41af-b852-5b3a3e7b0448",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -16.15282800815772
                },
                {
                    "sinsid": "6a56ca7b-4e22-48fe-83b1-b5eb4fc1d73a",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -16.15036005434783
                },
                {
                    "sinsid": "3862e5fc-a2f3-4f6c-ae89-fa1d88cba6b1",
                    "b1Name": "AKYEL-2",
                    "b2Name": "154",
                    "b3Name": "swTR-C",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -8.156034129692832
                },
                {
                    "sinsid": "87a18967-ed24-4996-93ed-ff1c7f884d69",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.994783180026282
                },
                {
                    "sinsid": "d1c7f9a4-f4e0-4de9-bddb-b659c55f6c83",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -11.99478318002628
                },
                {
                    "sinsid": "6c629b49-bd8f-477b-86a5-ac2d1f157b6b",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "KAZANDGK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.142607215793056
                },
                {
                    "sinsid": "6d0dd116-bcab-4573-a260-0c620ee468ba",
                    "b1Name": "SENDIRMK",
                    "b2Name": "154",
                    "b3Name": "OKSUTMDN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -53.79043537414966
                },
                {
                    "sinsid": "aea3006d-169c-41ce-8628-b0be975778ce",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.86149558123726
                },
                {
                    "sinsid": "2eb76242-a671-4cc8-8ed4-e365a35fd558",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "swTR-B",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -27.70425661914461
                },
                {
                    "sinsid": "b06c1431-90ac-43a5-9a83-918e1129f76e",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -22.72518891687657
                },
                {
                    "sinsid": "8938cfb0-4332-4587-ade4-76d5f3af0a9c",
                    "b1Name": "UZAYOSB",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -21.58110599078341
                },
                {
                    "sinsid": "e1de9eec-c369-49e0-8783-708f802fb767",
                    "b1Name": "HACILAR",
                    "b2Name": "154",
                    "b3Name": "ATAKALE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -48.1928231292517
                },
                {
                    "sinsid": "a2c8c9a2-7ce0-43dc-a0a0-caebca817caa",
                    "b1Name": "KUTUKLU",
                    "b2Name": "154",
                    "b3Name": "ORTAKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -9.98542291950887
                },
                {
                    "sinsid": "3f09cdcd-adb8-493d-8ecf-21c89d3f5e91",
                    "b1Name": "KALABA",
                    "b2Name": "154",
                    "b3Name": "URGUP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -19.369764705882353
                },
                {
                    "sinsid": "d0437626-8af3-45ca-bd96-338268ae753b",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -32.305961930659414
                },
                {
                    "sinsid": "2bf5b4d7-820c-47a3-a5ef-2f3fbe91e59c",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -23.989434954007884
                },
                {
                    "sinsid": "5da26dd9-6200-4b55-975e-1c88efc24e45",
                    "b1Name": "AKYURT",
                    "b2Name": "154",
                    "b3Name": "KALECIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -15.117388235294117
                },
                {
                    "sinsid": "6daad511-95a3-42e8-bfe6-cb3141a2520b",
                    "b1Name": "OKSUTTM",
                    "b2Name": "154",
                    "b3Name": "YAHYARBE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -61.679572573463936
                },
                {
                    "sinsid": "c1a72474-0193-4b43-98b1-e01d46da9a29",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.564771953710004
                },
                {
                    "sinsid": "c85d819f-0237-465c-8d48-91cc0a3330ae",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.564751531654185
                },
                {
                    "sinsid": "00b3785a-fee0-46ff-b9fd-11f273011bc6",
                    "b1Name": "BALGAT",
                    "b2Name": "154",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -24.217338325391417
                },
                {
                    "sinsid": "1da9aa8d-a26c-482e-ad99-1ee9019c3fc3",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "KARAPINA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -17.578208802456498
                },
                {
                    "sinsid": "7f6fe720-6e2e-47b1-8f55-205c176462ad",
                    "b1Name": "ERCIYESR",
                    "b2Name": "154",
                    "b3Name": "CAMLICA1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -40.2122380952381
                },
                {
                    "sinsid": "648e94d0-0439-4493-92b4-c52b7c5f8146",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "AKSRYOSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.555303340149965
                },
                {
                    "sinsid": "b7709e26-2dae-49b4-8856-279795e60d35",
                    "b1Name": "ESENBOGA",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.613798767967147
                },
                {
                    "sinsid": "d41c7fc4-ee3c-4b3f-ab17-f58793f47f0c",
                    "b1Name": "KARAMANR",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.473942122186497
                },
                {
                    "sinsid": "ed482a3a-e4bd-4728-97f6-1d63f0e04f8c",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "KARAMANR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.814546075085328
                },
                {
                    "sinsid": "3b99f063-0071-455e-b035-1fa31c41e431",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLICAG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.636089613034624
                },
                {
                    "sinsid": "7b85588b-9582-44a2-82ba-4cc71affcd03",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.291034013605437
                },
                {
                    "sinsid": "a169258f-b846-454f-a6fb-aae7911578d9",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -18.292709326072153
                },
                {
                    "sinsid": "7a16a290-8642-4911-8a79-a270d48e0dcc",
                    "b1Name": "DEL5",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T14:37:00.000Z",
                    "AVG(maxValue)": -6.83
                },
                {
                    "sinsid": "eb67e5a2-4e7b-4ff6-bfd2-7272d4e79288",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -25.792321307011573
                },
                {
                    "sinsid": "45655c46-2d9f-4a3b-9b0b-ee470a99b238",
                    "b1Name": "KAYSERI1",
                    "b2Name": "154",
                    "b3Name": "KAYSERI3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.28093877551021
                },
                {
                    "sinsid": "bffb2054-4b36-41dc-821c-be9477073204",
                    "b1Name": "KARMNBES",
                    "b2Name": "154",
                    "b3Name": "KARAMANO",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:40:00.000Z",
                    "AVG(maxValue)": -32.872058823529414
                },
                {
                    "sinsid": "2e951cc7-2098-4a8f-8a07-039fdf4affe0",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "swTR-A",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.66313524590164
                },
                {
                    "sinsid": "f87655d3-1c53-417d-9e63-ab529fd54ded",
                    "b1Name": "AKYEL-1",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -28.66201365187713
                },
                {
                    "sinsid": "3f414930-c159-467a-b017-e2c8e0471e05",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -37.769640434192674
                },
                {
                    "sinsid": "aca9b6ac-ca71-42c3-90d9-571ede93478e",
                    "b1Name": "ATAKALE",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -57.05653767820774
                },
                {
                    "sinsid": "cb556423-87f5-4bb7-891f-436e886f00f9",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -33.68835486063902
                },
                {
                    "sinsid": "98739da5-5f69-41f0-bb89-99cd5cfda82d",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "ERCIYESR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -57.69847398030943
                },
                {
                    "sinsid": "d84e984d-3784-4f61-8aeb-18843e081187",
                    "b1Name": "BASTAS",
                    "b2Name": "154",
                    "b3Name": "KAYAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -42.82204761904762
                },
                {
                    "sinsid": "e0497c90-a4a4-4a98-9c2c-1702a0e87c3f",
                    "b1Name": "TALAS",
                    "b2Name": "154",
                    "b3Name": "KAYS_KP2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -19.483826405867973
                },
                {
                    "sinsid": "a6523df2-4845-4b71-8bed-6f0b1b8d76f9",
                    "b1Name": "BOROSB",
                    "b2Name": "154",
                    "b3Name": "G4_BOR-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -25.32770767613039
                },
                {
                    "sinsid": "2a74ec7d-c294-48e8-8bb2-34454e557d95",
                    "b1Name": "CIHANBEY",
                    "b2Name": "154",
                    "b3Name": "ALTNEKIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -34.02547619047619
                },
                {
                    "sinsid": "52008e65-2738-4721-b50f-720446565ae1",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "swTRB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -37.41664179104477
                },
                {
                    "sinsid": "faef8388-46f6-4766-b8e3-f52a72fbb795",
                    "b1Name": "TALAS",
                    "b2Name": "154",
                    "b3Name": "KAYS_KP1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -21.21052703627652
                },
                {
                    "sinsid": "ccb9020c-0ea5-4365-ad77-f7a021be2308",
                    "b1Name": "BOZOKTM",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -63.12949625595643
                },
                {
                    "sinsid": "d92cd58d-fc73-4c20-8382-72c5ab718cce",
                    "b1Name": "YESILHIS",
                    "b2Name": "154",
                    "b3Name": "CAMLICA1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.619922535211266
                },
                {
                    "sinsid": "619d0180-93e6-4539-9fbd-a5cc3622966f",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:05:00.000Z",
                    "AVG(maxValue)": -21.136470588235294
                },
                {
                    "sinsid": "11e03afc-3d75-4029-ac2c-bac2ab1782b7",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "KAYACIK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -20.556593707250343
                },
                {
                    "sinsid": "fafe93b5-c069-4096-8f97-566531fae4cb",
                    "b1Name": "ANKARASA",
                    "b2Name": "154",
                    "b3Name": "ANKAR2-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -30.661299319727892
                },
                {
                    "sinsid": "ca0a8aa6-30e6-4a63-8fcc-65f1ea2fb522",
                    "b1Name": "TUZGOLGC",
                    "b2Name": "154",
                    "b3Name": "ESMEKAYA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:41:00.000Z",
                    "AVG(maxValue)": -15.823319283456264
                },
                {
                    "sinsid": "c9d382d1-f8f3-4233-a1d6-76f72e1cdb6d",
                    "b1Name": "KIZILIRM",
                    "b2Name": "154",
                    "b3Name": "KIRSEHIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -46.38641689373298
                },
                {
                    "sinsid": "990f41c7-725f-4625-a1de-98c499d29d70",
                    "b1Name": "URGUPTM",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -36.58867847411444
                },
                {
                    "sinsid": "bad5a267-7788-4854-b828-603bc8607cf8",
                    "b1Name": "ESENBOGA",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.122307692307686
                },
                {
                    "sinsid": "95c5530d-a2a4-40b8-9de4-e6990879c5ed",
                    "b1Name": "EMIRLER",
                    "b2Name": "154",
                    "b3Name": "KULU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -54.81031702274293
                },
                {
                    "sinsid": "3e5a9171-94d5-4bf2-8793-230ed4f8ff27",
                    "b1Name": "HASKOY",
                    "b2Name": "154",
                    "b3Name": "MAMAK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -36.31102040816326
                },
                {
                    "sinsid": "0f545cf8-98a0-489c-9786-c1f8ee9e6c33",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "KARGIHES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T20:34:00.000Z",
                    "AVG(maxValue)": -74.90466666666667
                },
                {
                    "sinsid": "070b6362-ad41-46f2-9a99-bfab98091062",
                    "b1Name": "HADIM",
                    "b2Name": "154",
                    "b3Name": "KEPEZKAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -54.23524804177547
                },
                {
                    "sinsid": "82012318-9b93-4e5c-9c29-d9607b83d26d",
                    "b1Name": "INCEK",
                    "b2Name": "154",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -39.63470046082949
                },
                {
                    "sinsid": "97adb5ba-13ad-4c3c-97cb-d02dd34d25cb",
                    "b1Name": "BOR",
                    "b2Name": "154",
                    "b3Name": "TOROSLAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -64.03884353741495
                },
                {
                    "sinsid": "1ef7ac1f-566f-413e-a65f-d3ee8e9e6c54",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "KAZANDG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -24.048008157715838
                },
                {
                    "sinsid": "b7a9d149-1993-4ebd-9508-7db25f2729db",
                    "b1Name": "ARDICLI",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.70060585432266
                },
                {
                    "sinsid": "e04c4190-72ee-43ac-88a5-e27d2d866a9a",
                    "b1Name": "DERINKUY",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -50.882977566281454
                },
                {
                    "sinsid": "0e052abc-3508-4942-bfc6-a2257ca3472a",
                    "b1Name": "ALTINEKN",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -36.975102040816324
                },
                {
                    "sinsid": "3c224e88-6952-4236-8700-5ba238495dd0",
                    "b1Name": "OVACIK",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -31.99505384615385
                },
                {
                    "sinsid": "183e24ee-2fc9-43cc-8279-e67d48880d04",
                    "b1Name": "KIRSEHIR",
                    "b2Name": "154",
                    "b3Name": "PETLAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -45.62365777080062
                },
                {
                    "sinsid": "fb8cc1a3-8b89-4fac-a5b1-0e19aea734e0",
                    "b1Name": "GUNEYSNR",
                    "b2Name": "154",
                    "b3Name": "HADIM",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -57.69625766871166
                },
                {
                    "sinsid": "874ebb8c-e3eb-4cd1-b512-c318ef8d1281",
                    "b1Name": "OVACIK",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -32.6807634164777
                },
                {
                    "sinsid": "74665387-d1c4-48aa-8324-df15ed35ff9d",
                    "b1Name": "TEKSINGE",
                    "b2Name": "154",
                    "b3Name": "AKYELRES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -55.912501704158146
                },
                {
                    "sinsid": "1b1ce649-2a80-4ae3-ab45-b50a8216a40d",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "KAYSER2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -39.465833900612665
                },
                {
                    "sinsid": "d98c5c93-dc6c-499f-80ce-0ea0da341db6",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "ARDICLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -51.04571428571429
                },
                {
                    "sinsid": "c326c55f-a7c8-43fa-b461-72004bef4045",
                    "b1Name": "KARAMANO",
                    "b2Name": "154",
                    "b3Name": "TEKSINGE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -57.52238225255973
                },
                {
                    "sinsid": "0108b0d5-c97a-4163-b8da-c57716f06a83",
                    "b1Name": "KAYSER3",
                    "b2Name": "154",
                    "b3Name": "CINKUR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -62.03054347826088
                },
                {
                    "sinsid": "3771a174-2d4e-4a07-9668-12d6bc262ebe",
                    "b1Name": "CUMRA",
                    "b2Name": "154",
                    "b3Name": "GUNEYSIN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -53.67134470989761
                },
                {
                    "sinsid": "6d9c2997-2dbb-4059-b0b0-4d78d77fc11c",
                    "b1Name": "KONYACIM",
                    "b2Name": "154",
                    "b3Name": "YAZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -24.472534153005466
                },
                {
                    "sinsid": "824b9bb1-d50a-43a9-8f22-dd4270331daf",
                    "b1Name": "BAGLARRE",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -75.66720298710116
                },
                {
                    "sinsid": "d76a8341-a4ee-460c-8012-7289e954a749",
                    "b1Name": "MERAMGIS",
                    "b2Name": "154",
                    "b3Name": "ALAKOVA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -33.39453125000001
                },
                {
                    "sinsid": "203725e2-8d63-4eaa-92cd-219c48583b6c",
                    "b1Name": "BALGAT",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -34.61379850238257
                },
                {
                    "sinsid": "05e66a74-3d94-46e3-93fa-d1348f1fbecc",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -67.70214965986395
                },
                {
                    "sinsid": "dad4abd5-5634-48cc-ab0e-922c09a32004",
                    "b1Name": "MUTLU5R",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -67.69706521739131
                },
                {
                    "sinsid": "5a643cab-236e-4e34-8bf4-aae7948d1166",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "TEMELLI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -54.226730115567634
                },
                {
                    "sinsid": "132bae33-8983-44e8-a8d0-dc7746fb8c77",
                    "b1Name": "KARMNBES",
                    "b2Name": "154",
                    "b3Name": "swTRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -31.348992857142854
                },
                {
                    "sinsid": "ff93e4c2-c041-40cd-8cd4-2256eb6dc83a",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "MACUNKO2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -31.49341145833333
                },
                {
                    "sinsid": "afb04ab4-0d95-49c7-924d-6d37b7c3906f",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "HASKOY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:07:00.000Z",
                    "AVG(maxValue)": -39.925999999999995
                },
                {
                    "sinsid": "5c4a56b5-41e1-4693-a497-7a0b630dc09b",
                    "b1Name": "BUSAN",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -45.30712338104976
                },
                {
                    "sinsid": "8a521155-6d5d-46ff-929f-81a7028da385",
                    "b1Name": "KAYSERI1",
                    "b2Name": "154",
                    "b3Name": "KAYSERI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -39.77625938566553
                },
                {
                    "sinsid": "6278526d-951f-42ef-a5f6-3b5f7f3d196f",
                    "b1Name": "BALGAT",
                    "b2Name": "154",
                    "b3Name": "MALTEPE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -49.90764785859959
                },
                {
                    "sinsid": "40a46a78-d796-4360-98c8-f58cfa60bd36",
                    "b1Name": "OYAK1GES",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -65.57213645761544
                },
                {
                    "sinsid": "ba422e9e-b552-4bb0-b874-5ced8f8c4030",
                    "b1Name": "TUMOSAN",
                    "b2Name": "154",
                    "b3Name": "BOROSB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -45.668027210884354
                },
                {
                    "sinsid": "31824126-11c6-4e15-a322-af89bb4b3a30",
                    "b1Name": "ERENKOY",
                    "b2Name": "154",
                    "b3Name": "SELCUKLU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -44.780047716428086
                },
                {
                    "sinsid": "6f98c2f9-6bbf-40ab-8510-40167a68e99c",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "GEZENDE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -45.17761255115962
                },
                {
                    "sinsid": "2b0d7ddd-3706-4d89-a167-6753568da96e",
                    "b1Name": "SIZIR",
                    "b2Name": "154",
                    "b3Name": "SARKISLA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -42.34058583106267
                },
                {
                    "sinsid": "c7361b8b-f46b-489b-94fa-178974ca3f02",
                    "b1Name": "NIGDE",
                    "b2Name": "154",
                    "b3Name": "YESILHIS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -65.47562882392931
                },
                {
                    "sinsid": "f177430b-cd7b-4880-9614-d775a267cb01",
                    "b1Name": "KARAMAN",
                    "b2Name": "154",
                    "b3Name": "MUTRES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -52.699624829467936
                },
                {
                    "sinsid": "24edfdae-73c8-4a9c-b1c3-ac314a4dc0d4",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "sOTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -51.32100748808713
                },
                {
                    "sinsid": "f90e1ecd-9e24-4e77-aa96-eac4a52b0c93",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "sOTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -51.32007488087133
                },
                {
                    "sinsid": "8fea57ce-946c-447b-9dce-b1ca0baf4c04",
                    "b1Name": "ERKILET",
                    "b2Name": "154",
                    "b3Name": "KAYSERI2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -51.60840027229407
                },
                {
                    "sinsid": "a3d02a48-9657-4372-b6b5-0c1f4b45535a",
                    "b1Name": "KAZAN",
                    "b2Name": "154",
                    "b3Name": "KAZANDG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -39.694908700322244
                },
                {
                    "sinsid": "80d5594f-b9b2-4a5a-9dea-a0d0328ea88c",
                    "b1Name": "ERYAMAN",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -66.53120923913043
                },
                {
                    "sinsid": "e161309a-e3a4-4d76-bb71-394082c792cb",
                    "b1Name": "ETI-SODA",
                    "b2Name": "154",
                    "b3Name": "BEYPAZAR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -48.085288461538454
                },
                {
                    "sinsid": "c5cbc7a4-96fe-4258-b2ac-e626d612a3c0",
                    "b1Name": "AKSRYOSB",
                    "b2Name": "154",
                    "b3Name": "DERINKUY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -67.11721957851802
                },
                {
                    "sinsid": "c06515d7-6141-45cb-85cf-11da62b9fe80",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "SIZIR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.095772634445204
                },
                {
                    "sinsid": "44deb723-0e5e-466c-b21d-dd850af07751",
                    "b1Name": "BEYPAZAR",
                    "b2Name": "154",
                    "b3Name": "OYAK1GES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -68.53394321766561
                },
                {
                    "sinsid": "151f9a67-9196-4488-b063-eba4ea41bbc4",
                    "b1Name": "K.EREGLI",
                    "b2Name": "154",
                    "b3Name": "KARAMANB",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -64.41753237900477
                },
                {
                    "sinsid": "d9533788-8fe1-4fbf-abcf-ff45ef4ca5e3",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swGTR2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -40.05259536784742
                },
                {
                    "sinsid": "17bed5dd-a29c-4df2-a549-dad0764400b0",
                    "b1Name": "ALAKOVA",
                    "b2Name": "154",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -61.36444822888284
                },
                {
                    "sinsid": "29abcd2d-f1f7-492e-ae51-909fcf3eba98",
                    "b1Name": "KARATAY",
                    "b2Name": "154",
                    "b3Name": "CUMRA",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -97.03930427493715
                },
                {
                    "sinsid": "6aacbfd4-c849-4e9b-b3f1-348a33ad56bd",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAPAS-H3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -58.53096928327645
                },
                {
                    "sinsid": "037b899d-594c-4207-80ec-723b5eb4b532",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAPAS-H1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.41125850340135
                },
                {
                    "sinsid": "893e64ae-e5ab-40b1-9b7e-455d31b94cc2",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "sOTR4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -65.74030612244898
                },
                {
                    "sinsid": "f9ac5848-8282-4ac7-b93d-33be3f342641",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "sOTR3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -65.74756296800545
                },
                {
                    "sinsid": "57fdc314-f966-4d9f-a269-de5388863215",
                    "b1Name": "CUMRA",
                    "b2Name": "154",
                    "b3Name": "DIANAGES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -84.79517358747447
                },
                {
                    "sinsid": "215afd26-360e-456a-b15f-1dbdde991b1c",
                    "b1Name": "KAYSERI2",
                    "b2Name": "154",
                    "b3Name": "KAPAS-H2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -60.67080436264486
                },
                {
                    "sinsid": "880116b4-4b01-43cf-a09b-286b6ebab445",
                    "b1Name": "BAGLICAG",
                    "b2Name": "154",
                    "b3Name": "SINCAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:40:00.000Z",
                    "AVG(maxValue)": -56.423846153846156
                },
                {
                    "sinsid": "41c6c2cb-64ea-42a6-94ed-f18c44cdc04d",
                    "b1Name": "DIANAGES",
                    "b2Name": "154",
                    "b3Name": "KARAMAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -87.44570247933883
                },
                {
                    "sinsid": "8aa60543-031e-4279-b7a6-dd2110d2620e",
                    "b1Name": "UMITKOY",
                    "b2Name": "154",
                    "b3Name": "ANKARA2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -55.79222826086957
                },
                {
                    "sinsid": "0a12cbd9-b16d-4974-a486-6bae07996382",
                    "b1Name": "SELCUKLU",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -67.60590320381732
                },
                {
                    "sinsid": "56a20782-c553-4afe-8448-25c7aa5d2053",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLUM1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.62265848670757
                },
                {
                    "sinsid": "c977bea4-20e5-4a41-9a75-5e61cae11209",
                    "b1Name": "MAMAK",
                    "b2Name": "154",
                    "b3Name": "KAYAS-3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -59.268944141689374
                },
                {
                    "sinsid": "7ed90811-ca99-498d-a02d-630ca4d984fd",
                    "b1Name": "YAZIR",
                    "b2Name": "154",
                    "b3Name": "KONYAKZY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -62.482050408719346
                },
                {
                    "sinsid": "1b77e196-18fa-46b1-be1d-d1ff3b0514a5",
                    "b1Name": "MACUNKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLUM2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -70.32394145677331
                },
                {
                    "sinsid": "071d0d66-3fb1-468f-8390-7573636745a5",
                    "b1Name": "HASKOY",
                    "b2Name": "154",
                    "b3Name": "BAGLUM-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -72.48329608938548
                },
                {
                    "sinsid": "a0822b11-39b7-49e5-9067-fedb20db1252",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "154",
                    "b3Name": "swOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -95.61678115799803
                },
                {
                    "sinsid": "a4cab8a8-384a-45f2-bd73-cabd0499e8a0",
                    "b1Name": "KONYAKZY",
                    "b2Name": "154",
                    "b3Name": "BAGLARRS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -112.82221311475409
                },
                {
                    "sinsid": "11563972-9534-4183-8f5f-ba633d23b375",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -81.36543847722639
                },
                {
                    "sinsid": "abc4e632-af36-46f4-9e62-560039922e97",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -81.36570360299118
                },
                {
                    "sinsid": "ac436d98-714b-4eb7-a877-c3800e18f3c2",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -102.64048332198776
                },
                {
                    "sinsid": "1d630793-d2bd-4fba-bfc4-3d20509cf606",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -103.72608310626703
                },
                {
                    "sinsid": "5e6bac62-25ff-4481-86f7-f2c715d6a25a",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -103.74802999318335
                },
                {
                    "sinsid": "731283f3-8779-47ae-aa7e-712138d28634",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -91.90584918478261
                },
                {
                    "sinsid": "9f071bb5-18df-4ed5-a16b-afb6ce647868",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -91.89095173351461
                },
                {
                    "sinsid": "867043af-570d-43da-a48d-89a49f35f1fe",
                    "b1Name": "AKKOPGIS",
                    "b2Name": "154",
                    "b3Name": "KAYAS",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -91.42989276139411
                },
                {
                    "sinsid": "396ab932-835c-4534-9117-ec600b4db61c",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -98.99453433038748
                },
                {
                    "sinsid": "5dcd76f7-db5c-465f-b25a-7a0be8b72550",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -98.97740136054422
                },
                {
                    "sinsid": "afadf5a2-364a-459e-8f9e-94bc2d1ae274",
                    "b1Name": "NALLIHAN",
                    "b2Name": "154",
                    "b3Name": "CAYIRHAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -113.80513966480444
                },
                {
                    "sinsid": "16b76a2c-5ba4-463c-8eb6-649374757232",
                    "b1Name": "YILDIZ",
                    "b2Name": "154",
                    "b3Name": "IMRAHOR",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -91.19733832539143
                },
                {
                    "sinsid": "3bf2ad88-58ed-4018-ac79-61838aad49db",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -101.01705163043479
                },
                {
                    "sinsid": "673c05e8-722d-45d0-a16e-6d2a4a1ebdcf",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -101.01705163043479
                },
                {
                    "sinsid": "20080de2-ebe4-4d04-be77-48b394292077",
                    "b1Name": "IMRAH101",
                    "b2Name": "154",
                    "b3Name": "KAYAS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -92.8437747440273
                },
                {
                    "sinsid": "56cbe1e3-b6f0-416a-aac8-08924361f354",
                    "b1Name": "IMRAHOR",
                    "b2Name": "154",
                    "b3Name": "KAYAS-1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -92.84409556313993
                },
                {
                    "sinsid": "921de96a-fa4d-48f4-9bc9-9e518680ae55",
                    "b1Name": "KARATAY",
                    "b2Name": "380",
                    "b3Name": "K.PINARG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:54:00.000Z",
                    "AVG(maxValue)": -263.8684273709484
                },
                {
                    "sinsid": "85069447-93f1-46be-9bcf-55bd5d3ecbfc",
                    "b1Name": "IMRAHOR",
                    "b2Name": "154",
                    "b3Name": "KAYAS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -114.62572305593453
                },
                {
                    "sinsid": "9a367f0a-023b-4c47-923d-dd7804576458",
                    "b1Name": "IMRAH101",
                    "b2Name": "154",
                    "b3Name": "KAYAS-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -114.62581855388815
                },
                {
                    "sinsid": "848f8cbc-806a-47be-b071-ba5af9cc7af3",
                    "b1Name": "MALTEPE",
                    "b2Name": "154",
                    "b3Name": "AKKOPRU",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -112.2612721088435
                },
                {
                    "sinsid": "bde71065-9e13-4d6b-8510-d32c9e885479",
                    "b1Name": "TEMELLI",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -131.4804761904762
                },
                {
                    "sinsid": "0c7ac670-b3db-4a41-aea2-b5cbab38f81a",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "KIRIKKAL",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -151.42850340136053
                },
                {
                    "sinsid": "6f40e0d8-9060-4ca3-bd44-5fefb1f4b90f",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "KOZAN1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -213.9071768707483
                },
                {
                    "sinsid": "0daec74f-3a18-4364-bda9-db7b6437792d",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -111.40492727272728
                },
                {
                    "sinsid": "0dcb54d9-a7a9-40ee-8694-c2b911928071",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -111.42018214936249
                },
                {
                    "sinsid": "61a48f35-f77f-4191-8d6e-8d07e1fc9d01",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "sOTR_3",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -111.82959810874704
                },
                {
                    "sinsid": "ca60fee0-5f20-4056-b9d8-1f351d93173b",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "sOTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -111.82959810874704
                },
                {
                    "sinsid": "c00d01a1-2630-48f5-a318-4500a8befc6c",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "KOZAN2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -216.20991836734686
                },
                {
                    "sinsid": "a9b190a5-a0a6-471d-8f93-051e2aced9a1",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "swGTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -98.87544883303413
                },
                {
                    "sinsid": "7ee64927-e03f-42a8-9b27-e2e543a9531b",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "ELBISTAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -152.2164408725603
                },
                {
                    "sinsid": "7e2637c9-bb09-45d3-9e0a-31367ef1f923",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -116.52053254437871
                },
                {
                    "sinsid": "8633a881-32af-40a2-9272-b0eade436be8",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -116.52053254437871
                },
                {
                    "sinsid": "5bd2e197-a403-4c2c-92ea-a0823bbe4d70",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "sOTR_1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -116.49395604395606
                },
                {
                    "sinsid": "f2652f02-6290-4f9a-b63b-1ae49b81996e",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "sOTR_2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -116.49395604395606
                },
                {
                    "sinsid": "32000831-f18d-4fac-934d-b83d58e3a9f7",
                    "b1Name": "KONYAKZY",
                    "b2Name": "380",
                    "b3Name": "KARATAY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -221.33029271613339
                },
                {
                    "sinsid": "39501565-2110-4fdc-a592-4c6d7877ff73",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -162.73216711956522
                },
                {
                    "sinsid": "42b84995-543a-4c25-93c0-078d4006bebf",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "KIRIKDG1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -179.88108747044916
                },
                {
                    "sinsid": "97a9bf21-cc7c-4eee-b9a5-e6b90df17af2",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "380",
                    "b3Name": "KIRIKDG1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -175.90037162162162
                },
                {
                    "sinsid": "9248e1dd-5ee5-46f7-b5c8-0902db5acdab",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "380",
                    "b3Name": "KIRIKDG2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -180.9840655737705
                },
                {
                    "sinsid": "b176765a-2d77-41ba-a6dc-04b60c2872ce",
                    "b1Name": "KAYAS",
                    "b2Name": "380",
                    "b3Name": "KIRIKDG2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:52:00.000Z",
                    "AVG(maxValue)": -183.17331797235022
                },
                {
                    "sinsid": "54a5bb76-a643-43c2-99cb-38b9f9965171",
                    "b1Name": "KAYSERI",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -207.40676650782848
                },
                {
                    "sinsid": "52248945-9685-4c26-a1a1-66c63f020719",
                    "b1Name": "BAGLUM",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -183.83937457511894
                },
                {
                    "sinsid": "f8367f77-a5d2-40af-95ed-fe519c655c96",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "swGTR_4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:53:00.000Z",
                    "AVG(maxValue)": -137.03678383128295
                },
                {
                    "sinsid": "c1422600-10b8-4e65-a924-d6e856516864",
                    "b1Name": "ANKARA-2",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -202.01103260869567
                },
                {
                    "sinsid": "32510f50-b623-4e0d-874e-dbfb4a8461b8",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -223.61580406654346
                },
                {
                    "sinsid": "b3e5c3c5-a995-4679-840f-59d50437d428",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "swOTR3.4",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:50:00.000Z",
                    "AVG(maxValue)": -223.65938534278962
                },
                {
                    "sinsid": "4978ac31-8673-425a-910a-eff223443523",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "swGTR1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -191.77717791411044
                },
                {
                    "sinsid": "1b491843-61a4-4e98-bfea-b49ee73b8a28",
                    "b1Name": "KAYAS",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -233.51159463487338
                },
                {
                    "sinsid": "5e088af4-9dc2-4f41-b4d8-935961fa0f09",
                    "b1Name": "KAYAS1TM",
                    "b2Name": "154",
                    "b3Name": "swOTR1.2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:49:00.000Z",
                    "AVG(maxValue)": -232.98710622710627
                },
                {
                    "sinsid": "3f84fa61-8f12-4fde-9d8f-b27ca57b56e9",
                    "b1Name": "KAZANDG",
                    "b2Name": "154",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -231.92891836734694
                },
                {
                    "sinsid": "fb82c106-3d46-4314-a393-c60cd3687e75",
                    "b1Name": "BOZOKTM",
                    "b2Name": "380",
                    "b3Name": "RESADIYE",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -408.00872427983546
                },
                {
                    "sinsid": "a6aed9fc-6229-442d-a889-d54fd4dd54d9",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "TUFANTES",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -376.88529611980937
                },
                {
                    "sinsid": "314adf7b-ddbb-400b-bd3a-3e3ddf293f57",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "RGKTOP",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -391.2099432221434
                },
                {
                    "sinsid": "a07864c8-8935-40b4-8c07-db0ef1507d96",
                    "b1Name": "CAYIRHAN",
                    "b2Name": "380",
                    "b3Name": "ANKARA-2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -515.7989154013017
                },
                {
                    "sinsid": "1665f084-81de-418c-ad22-29708aac5433",
                    "b1Name": "BAGLUM",
                    "b2Name": "380",
                    "b3Name": "KAYABASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -558.574944267516
                },
                {
                    "sinsid": "e2ea0920-f2ad-45eb-aadd-b70d1168cfe0",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "GOKSUNK",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -478.7447174948946
                },
                {
                    "sinsid": "a95265e7-80a2-43c1-b730-136b67d3aa6f",
                    "b1Name": "YESILHIS",
                    "b2Name": "380",
                    "b3Name": "GOKSUNG",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -486.4950101971447
                },
                {
                    "sinsid": "95963c3b-0f13-48c2-a368-0d045d37d93a",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "GOLBASI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -517.6006548933038
                },
                {
                    "sinsid": "76eca8a5-2dc0-46a9-9bcb-61a2fb383b0d",
                    "b1Name": "KAYSERI",
                    "b2Name": "380",
                    "b3Name": "KEBAN-2K",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -558.5365316205534
                },
                {
                    "sinsid": "13210e6a-a236-4a5e-a7ce-e7863946aa41",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "URGUP1",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -598.7809228650137
                },
                {
                    "sinsid": "fb4a00fe-b41a-4323-bcb5-24e48bdabf83",
                    "b1Name": "ANKARA-2",
                    "b2Name": "400",
                    "b3Name": "URGUP2",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -585.0189027777777
                },
                {
                    "sinsid": "0c5f0c91-d279-48b4-9fce-16babd4b30ae",
                    "b1Name": "URGUPTM",
                    "b2Name": "400",
                    "b3Name": "ELBISTAN",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -619.6411399317407
                },
                {
                    "sinsid": "f5795324-3d9a-4d05-bd5e-1abd8ee2d807",
                    "b1Name": "URGUPTM",
                    "b2Name": "400",
                    "b3Name": "COBANBEY",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -684.3420081967212
                },
                {
                    "sinsid": "a8c26e66-c04f-48b6-8b10-5f032b1ac190",
                    "b1Name": "YUNUSEMR",
                    "b2Name": "380",
                    "b3Name": "TEMELLI",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:55:00.000Z",
                    "AVG(maxValue)": -691.0947563486617
                },
                {
                    "sinsid": "6a3bb442-e105-48ff-812e-3137afbc41c4",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "YESILH-K",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -765.7429460013668
                },
                {
                    "sinsid": "eed09e0b-4cc9-4f8f-88df-37331c436282",
                    "b1Name": "TEMELLI",
                    "b2Name": "380",
                    "b3Name": "YESILH-G",
                    "elementName": "P",
                    "MAX(__time)": "2026-04-19T23:56:00.000Z",
                    "AVG(maxValue)": -767.0987329700272
                }
            ],
            "result_format": "json",
            "applied_filters": [
                {
                    "column": "elementName"
                },
                {
                    "column": "b2Name"
                },
                {
                    "column": "tear"
                }
            ],
            "rejected_filters": []
        }
    ]
}

<!DOCTYPE html>
<html>
    <head>
        <title>GOLBASI_YTM_P
        
      
    </title>
        <link rel="icon" type="image/png" href="/static/assets/images/teias-logo.jpg">
        <link rel="stylesheet" type="text/css" href="/static/appbuilder/css/flags/flags16.css"/>
        <link rel="stylesheet" type="text/css" href="/static/appbuilder/css/font-awesome.min.css">
        <!-- Bundle css theme START -->
        <link rel="stylesheet" type="text/css" href="/static/assets/theme.85a201b44eb4c791ba1e.entry.css"/>
        <!-- Bundle css theme END -->
        <!-- Bundle css spa START -->
        <link rel="stylesheet" type="text/css" href="/static/assets/spa.1629290a858fb4c14b5b.entry.css"/>
        <!-- Bundle css spa END -->
        <!-- Bundle js theme START -->
        <script src="/static/assets/theme.85a201b44eb4c791ba1e.entry.js" async></script>
        <!-- Bundle js theme END -->
        <input type="hidden" name="csrf_token" id="csrf_token" value="ImEwMTM2YzMxNzIyOTMyMmZkNmMwNmNkY2MwYWY4YWNlMTkzM2U3Zjci.aeVBvA.qoSIMtTyozwPb0oiJX2I3YDAEPk">
    </head>
    <body>
        <div id="app" data-bootstrap="{&#34;user&#34;: {&#34;username&#34;: &#34;murathanyeniceli&#34;, &#34;firstName&#34;: &#34;Murathan&#34;, &#34;lastName&#34;: &#34;YENICELI&#34;, &#34;userId&#34;: 60, &#34;isActive&#34;: true, &#34;isAnonymous&#34;: false, &#34;createdOn&#34;: &#34;2023-06-07T13:06:47.291278&#34;, &#34;email&#34;: &#34;murathan.yeniceli@teias.gov.tr&#34;, &#34;roles&#34;: {&#34;Admin&#34;: [[&#34;can_read&#34;, &#34;SavedQuery&#34;], [&#34;can_write&#34;, &#34;SavedQuery&#34;], [&#34;can_read&#34;, &#34;CssTemplate&#34;], [&#34;can_write&#34;, &#34;CssTemplate&#34;], [&#34;can_read&#34;, &#34;ReportSchedule&#34;], [&#34;can_write&#34;, &#34;ReportSchedule&#34;], [&#34;can_read&#34;, &#34;Chart&#34;], [&#34;can_write&#34;, &#34;Chart&#34;], [&#34;can_read&#34;, &#34;Annotation&#34;], [&#34;can_write&#34;, &#34;Annotation&#34;], [&#34;can_read&#34;, &#34;Dataset&#34;], [&#34;can_write&#34;, &#34;Dataset&#34;], [&#34;can_read&#34;, &#34;Log&#34;], [&#34;can_write&#34;, &#34;Log&#34;], [&#34;can_read&#34;, &#34;Dashboard&#34;], [&#34;can_write&#34;, &#34;Dashboard&#34;], [&#34;can_read&#34;, &#34;Database&#34;], [&#34;can_write&#34;, &#34;Database&#34;], [&#34;can_read&#34;, &#34;Query&#34;], [&#34;can_this_form_post&#34;, &#34;ResetPasswordView&#34;], [&#34;can_this_form_get&#34;, &#34;ResetPasswordView&#34;], [&#34;can_this_form_post&#34;, &#34;ResetMyPasswordView&#34;], [&#34;can_this_form_get&#34;, &#34;ResetMyPasswordView&#34;], [&#34;can_this_form_post&#34;, &#34;UserInfoEditView&#34;], [&#34;can_this_form_get&#34;, &#34;UserInfoEditView&#34;], [&#34;can_add&#34;, &#34;UserDBModelView&#34;], [&#34;can_userinfo&#34;, &#34;UserDBModelView&#34;], [&#34;can_edit&#34;, &#34;UserDBModelView&#34;], [&#34;can_list&#34;, &#34;UserDBModelView&#34;], [&#34;can_delete&#34;, &#34;UserDBModelView&#34;], [&#34;can_show&#34;, &#34;UserDBModelView&#34;], [&#34;resetmypassword&#34;, &#34;UserDBModelView&#34;], [&#34;resetpasswords&#34;, &#34;UserDBModelView&#34;], [&#34;userinfoedit&#34;, &#34;UserDBModelView&#34;], [&#34;can_add&#34;, &#34;RoleModelView&#34;], [&#34;can_edit&#34;, &#34;RoleModelView&#34;], [&#34;can_list&#34;, &#34;RoleModelView&#34;], [&#34;can_delete&#34;, &#34;RoleModelView&#34;], [&#34;can_show&#34;, &#34;RoleModelView&#34;], [&#34;copyrole&#34;, &#34;RoleModelView&#34;], [&#34;can_get&#34;, &#34;OpenApi&#34;], [&#34;can_show&#34;, &#34;SwaggerView&#34;], [&#34;can_get&#34;, &#34;MenuApi&#34;], [&#34;can_list&#34;, &#34;AsyncEventsRestApi&#34;], [&#34;can_invalidate&#34;, &#34;CacheRestApi&#34;], [&#34;can_export&#34;, &#34;Chart&#34;], [&#34;can_write&#34;, &#34;DashboardFilterStateRestApi&#34;], [&#34;can_read&#34;, &#34;DashboardFilterStateRestApi&#34;], [&#34;can_write&#34;, &#34;DashboardPermalinkRestApi&#34;], [&#34;can_read&#34;, &#34;DashboardPermalinkRestApi&#34;], [&#34;can_get_embedded&#34;, &#34;Dashboard&#34;], [&#34;can_set_embedded&#34;, &#34;Dashboard&#34;], [&#34;can_delete_embedded&#34;, &#34;Dashboard&#34;], [&#34;can_export&#34;, &#34;Dashboard&#34;], [&#34;can_export&#34;, &#34;Database&#34;], [&#34;can_export&#34;, &#34;Dataset&#34;], [&#34;can_write&#34;, &#34;ExploreFormDataRestApi&#34;], [&#34;can_read&#34;, &#34;ExploreFormDataRestApi&#34;], [&#34;can_write&#34;, &#34;ExplorePermalinkRestApi&#34;], [&#34;can_read&#34;, &#34;ExplorePermalinkRestApi&#34;], [&#34;can_add&#34;, &#34;FilterSets&#34;], [&#34;can_edit&#34;, &#34;FilterSets&#34;], [&#34;can_list&#34;, &#34;FilterSets&#34;], [&#34;can_delete&#34;, &#34;FilterSets&#34;], [&#34;can_import_&#34;, &#34;ImportExportRestApi&#34;], [&#34;can_export&#34;, &#34;ImportExportRestApi&#34;], [&#34;can_export&#34;, &#34;SavedQuery&#34;], [&#34;can_add&#34;, &#34;DynamicPlugin&#34;], [&#34;can_edit&#34;, &#34;DynamicPlugin&#34;], [&#34;can_download&#34;, &#34;DynamicPlugin&#34;], [&#34;can_list&#34;, &#34;DynamicPlugin&#34;], [&#34;can_delete&#34;, &#34;DynamicPlugin&#34;], [&#34;can_write&#34;, &#34;DynamicPlugin&#34;], [&#34;can_show&#34;, &#34;DynamicPlugin&#34;], [&#34;can_add&#34;, &#34;RowLevelSecurityFiltersModelView&#34;], [&#34;can_edit&#34;, &#34;RowLevelSecurityFiltersModelView&#34;], [&#34;can_download&#34;, &#34;RowLevelSecurityFiltersModelView&#34;], [&#34;can_list&#34;, &#34;RowLevelSecurityFiltersModelView&#34;], [&#34;can_delete&#34;, &#34;RowLevelSecurityFiltersModelView&#34;], [&#34;can_show&#34;, &#34;RowLevelSecurityFiltersModelView&#34;], [&#34;muldelete&#34;, &#34;RowLevelSecurityFiltersModelView&#34;], [&#34;can_query&#34;, &#34;Api&#34;], [&#34;can_time_range&#34;, &#34;Api&#34;], [&#34;can_query_form_data&#34;, &#34;Api&#34;], [&#34;can_this_form_post&#34;, &#34;CsvToDatabaseView&#34;], [&#34;can_this_form_get&#34;, &#34;CsvToDatabaseView&#34;], [&#34;can_this_form_post&#34;, &#34;ExcelToDatabaseView&#34;], [&#34;can_this_form_get&#34;, &#34;ExcelToDatabaseView&#34;], [&#34;can_this_form_post&#34;, &#34;ColumnarToDatabaseView&#34;], [&#34;can_this_form_get&#34;, &#34;ColumnarToDatabaseView&#34;], [&#34;can_save&#34;, &#34;Datasource&#34;], [&#34;can_external_metadata&#34;, &#34;Datasource&#34;], [&#34;can_get&#34;, &#34;Datasource&#34;], [&#34;can_external_metadata_by_name&#34;, &#34;Datasource&#34;], [&#34;can_get_value&#34;, &#34;KV&#34;], [&#34;can_store&#34;, &#34;KV&#34;], [&#34;can_my_queries&#34;, &#34;SqlLab&#34;], [&#34;can_datasources&#34;, &#34;Superset&#34;], [&#34;can_queries&#34;, &#34;Superset&#34;], [&#34;can_explore_json&#34;, &#34;Superset&#34;], [&#34;can_fave_slices&#34;, &#34;Superset&#34;], [&#34;can_user_slices&#34;, &#34;Superset&#34;], [&#34;can_publish&#34;, &#34;Superset&#34;], [&#34;can_slice&#34;, &#34;Superset&#34;], [&#34;can_filter&#34;, &#34;Superset&#34;], [&#34;can_profile&#34;, &#34;Superset&#34;], [&#34;can_fave_dashboards_by_username&#34;, &#34;Superset&#34;], [&#34;can_recent_activity&#34;, &#34;Superset&#34;], [&#34;can_sqllab_history&#34;, &#34;Superset&#34;], [&#34;can_import_dashboards&#34;, &#34;Superset&#34;], [&#34;can_override_role_permissions&#34;, &#34;Superset&#34;], [&#34;can_dashboard&#34;, &#34;Superset&#34;], [&#34;can_sql_json&#34;, &#34;Superset&#34;], [&#34;can_created_slices&#34;, &#34;Superset&#34;], [&#34;can_created_dashboards&#34;, &#34;Superset&#34;], [&#34;can_sqllab_viz&#34;, &#34;Superset&#34;], [&#34;can_annotation_json&#34;, &#34;Superset&#34;], [&#34;can_extra_table_metadata&#34;, &#34;Superset&#34;], [&#34;can_csv&#34;, &#34;Superset&#34;], [&#34;can_fetch_datasource_metadata&#34;, &#34;Superset&#34;], [&#34;can_search_queries&#34;, &#34;Superset&#34;], [&#34;can_stop_query&#34;, &#34;Superset&#34;], [&#34;can_request_access&#34;, &#34;Superset&#34;], [&#34;can_schemas&#34;, &#34;Superset&#34;], [&#34;can_validate_sql_json&#34;, &#34;Superset&#34;], [&#34;can_csrf_token&#34;, &#34;Superset&#34;], [&#34;can_sqllab_table_viz&#34;, &#34;Superset&#34;], [&#34;can_explore&#34;, &#34;Superset&#34;], [&#34;can_dashboard_permalink&#34;, &#34;Superset&#34;], [&#34;can_approve&#34;, &#34;Superset&#34;], [&#34;can_copy_dash&#34;, &#34;Superset&#34;], [&#34;can_sqllab&#34;, &#34;Superset&#34;], [&#34;can_log&#34;, &#34;Superset&#34;], [&#34;can_add_slices&#34;, &#34;Superset&#34;], [&#34;can_select_star&#34;, &#34;Superset&#34;], [&#34;can_tables&#34;, &#34;Superset&#34;], [&#34;can_save_dash&#34;, &#34;Superset&#34;], [&#34;can_warm_up_cache&#34;, &#34;Superset&#34;], [&#34;can_results&#34;, &#34;Superset&#34;], [&#34;can_available_domains&#34;, &#34;Superset&#34;], [&#34;can_sync_druid_source&#34;, &#34;Superset&#34;], [&#34;can_estimate_query_cost&#34;, &#34;Superset&#34;], [&#34;can_fave_dashboards&#34;, &#34;Superset&#34;], [&#34;can_slice_json&#34;, &#34;Superset&#34;], [&#34;can_favstar&#34;, &#34;Superset&#34;], [&#34;can_schemas_access_for_file_upload&#34;, &#34;Superset&#34;], [&#34;can_testconn&#34;, &#34;Superset&#34;], [&#34;can_expanded&#34;, &#34;TableSchemaView&#34;], [&#34;can_delete&#34;, &#34;TableSchemaView&#34;], [&#34;can_post&#34;, &#34;TableSchemaView&#34;], [&#34;can_migrate_query&#34;, &#34;TabStateView&#34;], [&#34;can_delete&#34;, &#34;TabStateView&#34;], [&#34;can_put&#34;, &#34;TabStateView&#34;], [&#34;can_get&#34;, &#34;TabStateView&#34;], [&#34;can_activate&#34;, &#34;TabStateView&#34;], [&#34;can_delete_query&#34;, &#34;TabStateView&#34;], [&#34;can_post&#34;, &#34;TabStateView&#34;], [&#34;can_tagged_objects&#34;, &#34;TagView&#34;], [&#34;can_delete&#34;, &#34;TagView&#34;], [&#34;can_get&#34;, &#34;TagView&#34;], [&#34;can_suggestions&#34;, &#34;TagView&#34;], [&#34;can_post&#34;, &#34;TagView&#34;], [&#34;can_grant_guest_token&#34;, &#34;SecurityRestApi&#34;], [&#34;can_read&#34;, &#34;SecurityRestApi&#34;], [&#34;can_add&#34;, &#34;DashboardEmailScheduleView&#34;], [&#34;can_edit&#34;, &#34;DashboardEmailScheduleView&#34;], [&#34;can_list&#34;, &#34;DashboardEmailScheduleView&#34;], [&#34;can_delete&#34;, &#34;DashboardEmailScheduleView&#34;], [&#34;can_show&#34;, &#34;DashboardEmailScheduleView&#34;], [&#34;muldelete&#34;, &#34;DashboardEmailScheduleView&#34;], [&#34;can_add&#34;, &#34;SliceEmailScheduleView&#34;], [&#34;can_edit&#34;, &#34;SliceEmailScheduleView&#34;], [&#34;can_list&#34;, &#34;SliceEmailScheduleView&#34;], [&#34;can_delete&#34;, &#34;SliceEmailScheduleView&#34;], [&#34;can_show&#34;, &#34;SliceEmailScheduleView&#34;], [&#34;muldelete&#34;, &#34;SliceEmailScheduleView&#34;], [&#34;can_add&#34;, &#34;AlertModelView&#34;], [&#34;can_edit&#34;, &#34;AlertModelView&#34;], [&#34;can_list&#34;, &#34;AlertModelView&#34;], [&#34;can_delete&#34;, &#34;AlertModelView&#34;], [&#34;can_show&#34;, &#34;AlertModelView&#34;], [&#34;can_show&#34;, &#34;AlertLogModelView&#34;], [&#34;can_list&#34;, &#34;AlertLogModelView&#34;], [&#34;can_show&#34;, &#34;AlertObservationModelView&#34;], [&#34;can_list&#34;, &#34;AlertObservationModelView&#34;], [&#34;can_add&#34;, &#34;AccessRequestsModelView&#34;], [&#34;can_edit&#34;, &#34;AccessRequestsModelView&#34;], [&#34;can_list&#34;, &#34;AccessRequestsModelView&#34;], [&#34;can_delete&#34;, &#34;AccessRequestsModelView&#34;], [&#34;can_show&#34;, &#34;AccessRequestsModelView&#34;], [&#34;muldelete&#34;, &#34;AccessRequestsModelView&#34;], [&#34;can_add&#34;, &#34;DruidDatasourceModelView&#34;], [&#34;can_edit&#34;, &#34;DruidDatasourceModelView&#34;], [&#34;can_list&#34;, &#34;DruidDatasourceModelView&#34;], [&#34;can_delete&#34;, &#34;DruidDatasourceModelView&#34;], [&#34;can_show&#34;, &#34;DruidDatasourceModelView&#34;], [&#34;muldelete&#34;, &#34;DruidDatasourceModelView&#34;], [&#34;yaml_export&#34;, &#34;DruidDatasourceModelView&#34;], [&#34;can_add&#34;, &#34;DruidClusterModelView&#34;], [&#34;can_edit&#34;, &#34;DruidClusterModelView&#34;], [&#34;can_list&#34;, &#34;DruidClusterModelView&#34;], [&#34;can_delete&#34;, &#34;DruidClusterModelView&#34;], [&#34;can_show&#34;, &#34;DruidClusterModelView&#34;], [&#34;muldelete&#34;, &#34;DruidClusterModelView&#34;], [&#34;yaml_export&#34;, &#34;DruidClusterModelView&#34;], [&#34;can_add&#34;, &#34;DruidMetricInlineView&#34;], [&#34;can_edit&#34;, &#34;DruidMetricInlineView&#34;], [&#34;can_list&#34;, &#34;DruidMetricInlineView&#34;], [&#34;can_delete&#34;, &#34;DruidMetricInlineView&#34;], [&#34;can_add&#34;, &#34;DruidColumnInlineView&#34;], [&#34;can_edit&#34;, &#34;DruidColumnInlineView&#34;], [&#34;can_list&#34;, &#34;DruidColumnInlineView&#34;], [&#34;can_delete&#34;, &#34;DruidColumnInlineView&#34;], [&#34;can_refresh_datasources&#34;, &#34;Druid&#34;], [&#34;can_scan_new_datasources&#34;, &#34;Druid&#34;], [&#34;menu_access&#34;, &#34;Security&#34;], [&#34;menu_access&#34;, &#34;List Users&#34;], [&#34;menu_access&#34;, &#34;List Roles&#34;], [&#34;menu_access&#34;, &#34;Row Level Security&#34;], [&#34;menu_access&#34;, &#34;Action Log&#34;], [&#34;menu_access&#34;, &#34;Access requests&#34;], [&#34;menu_access&#34;, &#34;Home&#34;], [&#34;menu_access&#34;, &#34;Manage&#34;], [&#34;menu_access&#34;, &#34;Annotation Layers&#34;], [&#34;menu_access&#34;, &#34;Plugins&#34;], [&#34;menu_access&#34;, &#34;CSS Templates&#34;], [&#34;menu_access&#34;, &#34;Import Dashboards&#34;], [&#34;menu_access&#34;, &#34;Dashboard Email Schedules&#34;], [&#34;menu_access&#34;, &#34;Chart Emails&#34;], [&#34;menu_access&#34;, &#34;Alerts&#34;], [&#34;menu_access&#34;, &#34;Alerts &amp; Report&#34;], [&#34;menu_access&#34;, &#34;Dashboards&#34;], [&#34;menu_access&#34;, &#34;Charts&#34;], [&#34;menu_access&#34;, &#34;SQL Lab&#34;], [&#34;menu_access&#34;, &#34;SQL Editor&#34;], [&#34;menu_access&#34;, &#34;Saved Queries&#34;], [&#34;menu_access&#34;, &#34;Query Search&#34;], [&#34;menu_access&#34;, &#34;Data&#34;], [&#34;menu_access&#34;, &#34;Databases&#34;], [&#34;menu_access&#34;, &#34;Datasets&#34;], [&#34;menu_access&#34;, &#34;Druid Datasources&#34;], [&#34;menu_access&#34;, &#34;Druid Clusters&#34;], [&#34;menu_access&#34;, &#34;Scan New Datasources&#34;], [&#34;menu_access&#34;, &#34;Refresh Druid Metadata&#34;], [&#34;all_datasource_access&#34;, &#34;all_datasource_access&#34;], [&#34;all_database_access&#34;, &#34;all_database_access&#34;], [&#34;all_query_access&#34;, &#34;all_query_access&#34;], [&#34;can_share_dashboard&#34;, &#34;Superset&#34;], [&#34;can_share_chart&#34;, &#34;Superset&#34;], [&#34;can_read&#34;, &#34;AdvancedDataType&#34;], [&#34;can_read&#34;, &#34;AvailableDomains&#34;], [&#34;can_get_or_create_dataset&#34;, &#34;Dataset&#34;], [&#34;can_duplicate&#34;, &#34;Dataset&#34;], [&#34;can_get_column_values&#34;, &#34;Datasource&#34;], [&#34;can_read&#34;, &#34;EmbeddedDashboard&#34;], [&#34;can_read&#34;, &#34;Explore&#34;], [&#34;can_write&#34;, &#34;Tag&#34;], [&#34;can_read&#34;, &#34;Tag&#34;], [&#34;can_estimate_query_cost&#34;, &#34;SQLLab&#34;], [&#34;can_get_results&#34;, &#34;SQLLab&#34;], [&#34;can_execute_sql_query&#34;, &#34;SQLLab&#34;], [&#34;can_export_csv&#34;, &#34;SQLLab&#34;], [&#34;can_samples&#34;, &#34;Datasource&#34;], [&#34;can_tags&#34;, &#34;TagView&#34;], [&#34;can_download&#34;, &#34;Tags&#34;], [&#34;can_show&#34;, &#34;Tags&#34;], [&#34;can_edit&#34;, &#34;Tags&#34;], [&#34;can_add&#34;, &#34;Tags&#34;], [&#34;can_delete&#34;, &#34;Tags&#34;], [&#34;can_list&#34;, &#34;Tags&#34;], [&#34;can_recent_activity&#34;, &#34;Log&#34;], [&#34;menu_access&#34;, &#34;All Entities&#34;], [&#34;menu_access&#34;, &#34;Tags&#34;]]}, &#34;permissions&#34;: {}}, &#34;common&#34;: {&#34;conf&#34;: {&#34;SUPERSET_WEBSERVER_TIMEOUT&#34;: 300, &#34;SUPERSET_DASHBOARD_POSITION_DATA_LIMIT&#34;: 65535, &#34;SUPERSET_DASHBOARD_PERIODICAL_REFRESH_LIMIT&#34;: 0, &#34;SUPERSET_DASHBOARD_PERIODICAL_REFRESH_WARNING_MESSAGE&#34;: null, &#34;DISABLE_DATASET_SOURCE_EDIT&#34;: null, &#34;ENABLE_JAVASCRIPT_CONTROLS&#34;: null, &#34;ENABLE_BROAD_ACTIVITY_ACCESS&#34;: true, &#34;DEFAULT_SQLLAB_LIMIT&#34;: 1000, &#34;DEFAULT_VIZ_TYPE&#34;: &#34;table&#34;, &#34;SQL_MAX_ROW&#34;: 5000000, &#34;SUPERSET_WEBSERVER_DOMAINS&#34;: null, &#34;SQLLAB_SAVE_WARNING_MESSAGE&#34;: null, &#34;DISPLAY_MAX_ROW&#34;: 10000, &#34;GLOBAL_ASYNC_QUERIES_TRANSPORT&#34;: &#34;polling&#34;, &#34;GLOBAL_ASYNC_QUERIES_POLLING_DELAY&#34;: 500, &#34;SQL_VALIDATORS_BY_ENGINE&#34;: {&#34;presto&#34;: &#34;PrestoDBSQLValidator&#34;, &#34;postgresql&#34;: &#34;PostgreSQLValidator&#34;}, &#34;SQLALCHEMY_DOCS_URL&#34;: null, &#34;SQLALCHEMY_DISPLAY_TEXT&#34;: null, &#34;GLOBAL_ASYNC_QUERIES_WEBSOCKET_URL&#34;: &#34;ws://127.0.0.1:8080/&#34;, &#34;DASHBOARD_AUTO_REFRESH_MODE&#34;: &#34;force&#34;, &#34;DASHBOARD_AUTO_REFRESH_INTERVALS&#34;: [[0, &#34;Don&#39;t refresh&#34;], [10, &#34;10 seconds&#34;], [30, &#34;30 seconds&#34;], [60, &#34;1 minute&#34;], [300, &#34;5 minutes&#34;], [1800, &#34;30 minutes&#34;], [3600, &#34;1 hour&#34;], [21600, &#34;6 hours&#34;], [43200, &#34;12 hours&#34;], [86400, &#34;24 hours&#34;]], &#34;DASHBOARD_VIRTUALIZATION&#34;: null, &#34;SCHEDULED_QUERIES&#34;: {}, &#34;EXCEL_EXTENSIONS&#34;: [&#34;xls&#34;, &#34;xlsx&#34;], &#34;CSV_EXTENSIONS&#34;: [&#34;csv&#34;, &#34;txt&#34;, &#34;tsv&#34;], &#34;COLUMNAR_EXTENSIONS&#34;: [&#34;zip&#34;, &#34;parquet&#34;], &#34;ALLOWED_EXTENSIONS&#34;: [&#34;txt&#34;, &#34;tsv&#34;, &#34;xlsx&#34;, &#34;zip&#34;, &#34;csv&#34;, &#34;xls&#34;, &#34;parquet&#34;], &#34;SAMPLES_ROW_LIMIT&#34;: 1000, &#34;DEFAULT_TIME_FILTER&#34;: &#34;No filter&#34;, &#34;HTML_SANITIZATION&#34;: true, &#34;HTML_SANITIZATION_SCHEMA_EXTENSIONS&#34;: {}, &#34;WELCOME_PAGE_LAST_TAB&#34;: &#34;all&#34;, &#34;VIZ_TYPE_DENYLIST&#34;: [], &#34;ALERT_REPORTS_NOTIFICATION_METHODS&#34;: [&#34;Email&#34;], &#34;HAS_GSHEETS_INSTALLED&#34;: false}, &#34;locale&#34;: &#34;en&#34;, &#34;language_pack&#34;: {&#34;domain&#34;: &#34;superset&#34;, &#34;locale_data&#34;: {&#34;superset&#34;: {&#34;&#34;: {&#34;domain&#34;: &#34;superset&#34;, &#34;plural_forms&#34;: &#34;nplurals=2; plural=(n != 1)&#34;, &#34;lang&#34;: &#34;en&#34;}, &#34;Home&#34;: [&#34;&#34;], &#34;Annotation Layers&#34;: [&#34;&#34;], &#34;Manage&#34;: [&#34;&#34;], &#34;Databases&#34;: [&#34;&#34;], &#34;Data&#34;: [&#34;&#34;], &#34;Datasets&#34;: [&#34;&#34;], &#34;Charts&#34;: [&#34;&#34;], &#34;Dashboards&#34;: [&#34;&#34;], &#34;Plugins&#34;: [&#34;&#34;], &#34;CSS Templates&#34;: [&#34;&#34;], &#34;Row level security&#34;: [&#34;&#34;], &#34;Security&#34;: [&#34;&#34;], &#34;Import Dashboards&#34;: [&#34;&#34;], &#34;SQL Editor&#34;: [&#34;&#34;], &#34;SQL Lab&#34;: [&#34;&#34;], &#34;Saved Queries&#34;: [&#34;&#34;], &#34;Query History&#34;: [&#34;&#34;], &#34;Upload a CSV&#34;: [&#34;&#34;], &#34;Upload Excel&#34;: [&#34;&#34;], &#34;Action Log&#34;: [&#34;&#34;], &#34;Dashboard Emails&#34;: [&#34;&#34;], &#34;Chart Email Schedules&#34;: [&#34;&#34;], &#34;Alerts&#34;: [&#34;&#34;], &#34;Alerts &amp; Reports&#34;: [&#34;&#34;], &#34;Access requests&#34;: [&#34;&#34;], &#34;Druid Datasources&#34;: [&#34;&#34;], &#34;Druid Clusters&#34;: [&#34;&#34;], &#34;Scan New Datasources&#34;: [&#34;&#34;], &#34;Refresh Druid Metadata&#34;: [&#34;&#34;], &#34;Issue 1000 - The datasource is too large to query.&#34;: [&#34;&#34;], &#34;Issue 1001 - The database is under an unusual load.&#34;: [&#34;&#34;], &#34;Issue 1002 - The database returned an unexpected error.&#34;: [&#34;&#34;], &#34;Issue 1003 - There is a syntax error in the SQL query. Perhaps there was a misspelling or a typo.&#34;: [&#34;&#34;], &#34;Issue 1004 - The column was deleted or renamed in the database.&#34;: [&#34;&#34;], &#34;Issue 1005 - The table was deleted or renamed in the database.&#34;: [&#34;&#34;], &#34;Issue 1006 - One or more parameters specified in the query are missing.&#34;: [&#34;&#34;], &#34;Invalid certificate&#34;: [&#34;&#34;], &#34;Unsafe return type for function %(func)s: %(value_type)s&#34;: [&#34;&#34;], &#34;Unsupported return value for method %(name)s&#34;: [&#34;&#34;], &#34;Unsafe template value for key %(key)s: %(value_type)s&#34;: [&#34;&#34;], &#34;Unsupported template value for key %(key)s&#34;: [&#34;&#34;], &#34;Only `SELECT` statements are allowed against this database&#34;: [&#34;&#34;], &#34;CTAS (create table as select) can only be run with a query where the last statement is a SELECT. Please make sure your query has a SELECT as its last statement. Then, try running your query again.&#34;: [&#34;&#34;], &#34;CVAS (create view as select) can only be run with a query with a single SELECT statement. Please make sure your query has only a SELECT statement. Then, try running your query again.&#34;: [&#34;&#34;], &#34;Viz is missing a datasource&#34;: [&#34;&#34;], &#34;Applied rolling window did not return any data. Please make sure the source query satisfies the minimum periods defined in the rolling window.&#34;: [&#34;&#34;], &#34;From date cannot be larger than to date&#34;: [&#34;&#34;], &#34;Cached value not found&#34;: [&#34;&#34;], &#34;Columns missing in datasource: %(invalid_columns)s&#34;: [&#34;&#34;], &#34;Table View&#34;: [&#34;&#34;], &#34;You cannot use [Columns] in combination with [Group By]/[Metrics]/[Percentage Metrics]. Please choose one or the other.&#34;: [&#34;&#34;], &#34;Pick a granularity in the Time section or uncheck &#39;Include Time&#39;&#34;: [&#34;&#34;], &#34;Time Table View&#34;: [&#34;&#34;], &#34;Pick at least one metric&#34;: [&#34;&#34;], &#34;When using &#39;Group By&#39; you are limited to use a single metric&#34;: [&#34;&#34;], &#34;Pivot Table&#34;: [&#34;&#34;], &#34;Please choose at least one &#39;Group by&#39; field &#34;: [&#34;&#34;], &#34;Please choose at least one metric&#34;: [&#34;&#34;], &#34;Group By&#39; and &#39;Columns&#39; can&#39;t overlap&#34;: [&#34;&#34;], &#34;Treemap&#34;: [&#34;&#34;], &#34;Calendar Heatmap&#34;: [&#34;&#34;], &#34;Bubble Chart&#34;: [&#34;&#34;], &#34;Please use 3 different metric labels&#34;: [&#34;&#34;], &#34;Pick a metric for x, y and size&#34;: [&#34;&#34;], &#34;Bullet Chart&#34;: [&#34;&#34;], &#34;Pick a metric to display&#34;: [&#34;&#34;], &#34;Big Number with Trendline&#34;: [&#34;&#34;], &#34;Pick a metric!&#34;: [&#34;&#34;], &#34;Big Number&#34;: [&#34;&#34;], &#34;Time Series - Line Chart&#34;: [&#34;&#34;], &#34;Pick a time granularity for your time series&#34;: [&#34;&#34;], &#34;An enclosed time range (both start and end) must be specified when using a Time Comparison.&#34;: [&#34;&#34;], &#34;Time Series - Multiple Line Charts&#34;: [&#34;&#34;], &#34;Time Series - Dual Axis Line Chart&#34;: [&#34;&#34;], &#34;Pick a metric for left axis!&#34;: [&#34;&#34;], &#34;Pick a metric for right axis!&#34;: [&#34;&#34;], &#34;Please choose different metrics on left and right axis&#34;: [&#34;&#34;], &#34;Time Series - Bar Chart&#34;: [&#34;&#34;], &#34;Time Series - Period Pivot&#34;: [&#34;&#34;], &#34;Time Series - Percent Change&#34;: [&#34;&#34;], &#34;Time Series - Stacked&#34;: [&#34;&#34;], &#34;Histogram&#34;: [&#34;&#34;], &#34;Must have at least one numeric column specified&#34;: [&#34;&#34;], &#34;Distribution - Bar Chart&#34;: [&#34;&#34;], &#34;Can&#39;t have overlap between Series and Breakdowns&#34;: [&#34;&#34;], &#34;Pick at least one field for [Series]&#34;: [&#34;&#34;], &#34;Sunburst&#34;: [&#34;&#34;], &#34;Sankey&#34;: [&#34;&#34;], &#34;Pick exactly 2 columns as [Source / Target]&#34;: [&#34;&#34;], &#34;There&#39;s a loop in your Sankey, please provide a tree. Here&#39;s a faulty link: {}&#34;: [&#34;&#34;], &#34;Directed Force Layout&#34;: [&#34;&#34;], &#34;Pick exactly 2 columns to &#39;Group By&#39;&#34;: [&#34;&#34;], &#34;Country Map&#34;: [&#34;&#34;], &#34;World Map&#34;: [&#34;&#34;], &#34;Filters&#34;: [&#34;&#34;], &#34;Invalid filter configuration, please select a column&#34;: [&#34;&#34;], &#34;Parallel Coordinates&#34;: [&#34;&#34;], &#34;Heatmap&#34;: [&#34;&#34;], &#34;Horizon Charts&#34;: [&#34;&#34;], &#34;Mapbox&#34;: [&#34;&#34;], &#34;[Longitude] and [Latitude] must be set&#34;: [&#34;&#34;], &#34;Must have a [Group By] column to have &#39;count&#39; as the [Label]&#34;: [&#34;&#34;], &#34;Choice of [Label] must be present in [Group By]&#34;: [&#34;&#34;], &#34;Choice of [Point Radius] must be present in [Group By]&#34;: [&#34;&#34;], &#34;[Longitude] and [Latitude] columns must be present in [Group By]&#34;: [&#34;&#34;], &#34;Deck.gl - Multiple Layers&#34;: [&#34;&#34;], &#34;Bad spatial key&#34;: [&#34;&#34;], &#34;Invalid spatial point encountered: %s&#34;: [&#34;&#34;], &#34;Encountered invalid NULL spatial entry,                                        please consider filtering those out&#34;: [&#34;&#34;], &#34;Deck.gl - Scatter plot&#34;: [&#34;&#34;], &#34;Deck.gl - Screen Grid&#34;: [&#34;&#34;], &#34;Deck.gl - 3D Grid&#34;: [&#34;&#34;], &#34;Deck.gl - Paths&#34;: [&#34;&#34;], &#34;Deck.gl - Polygon&#34;: [&#34;&#34;], &#34;Deck.gl - 3D HEX&#34;: [&#34;&#34;], &#34;Deck.gl - GeoJSON&#34;: [&#34;&#34;], &#34;Deck.gl - Arc&#34;: [&#34;&#34;], &#34;Event flow&#34;: [&#34;&#34;], &#34;Time Series - Paired t-test&#34;: [&#34;&#34;], &#34;Time Series - Nightingale Rose Chart&#34;: [&#34;&#34;], &#34;Partition Diagram&#34;: [&#34;&#34;], &#34;Choose either fields to [Group By] and [Metrics] and/or [Percentage Metrics], or [Columns], not both&#34;: [&#34;&#34;], &#34;Box Plot&#34;: [&#34;&#34;], &#34;Distribution - NVD3 - Pie Chart&#34;: [&#34;&#34;], &#34;iFrame&#34;: [&#34;&#34;], &#34;Deleted %(num)d annotation layer&#34;: [&#34;&#34;, &#34;Deleted %(num)d annotation layers&#34;], &#34;All Text&#34;: [&#34;&#34;], &#34;Deleted %(num)d annotation&#34;: [&#34;&#34;, &#34;Deleted %(num)d annotations&#34;], &#34;End date must be after start date&#34;: [&#34;&#34;], &#34;Short description must be unique for this layer&#34;: [&#34;&#34;], &#34;Annotations could not be deleted.&#34;: [&#34;&#34;], &#34;Annotation not found.&#34;: [&#34;&#34;], &#34;Annotation parameters are invalid.&#34;: [&#34;&#34;], &#34;Annotation could not be created.&#34;: [&#34;&#34;], &#34;Annotation could not be updated.&#34;: [&#34;&#34;], &#34;Annotation delete failed.&#34;: [&#34;&#34;], &#34;Annotation layer parameters are invalid.&#34;: [&#34;&#34;], &#34;Annotation layer could not be deleted.&#34;: [&#34;&#34;], &#34;Annotation layer could not be created.&#34;: [&#34;&#34;], &#34;Annotation layer could not be updated.&#34;: [&#34;&#34;], &#34;Annotation layer not found.&#34;: [&#34;&#34;], &#34;Annotation layer delete failed.&#34;: [&#34;&#34;], &#34;Annotation layer has associated annotations.&#34;: [&#34;&#34;], &#34;Name must be unique&#34;: [&#34;&#34;], &#34;Deleted %(num)d chart&#34;: [&#34;&#34;, &#34;Deleted %(num)d charts&#34;], &#34;Request is not JSON&#34;: [&#34;&#34;], &#34;Request is incorrect: %(error)s&#34;: [&#34;&#34;], &#34;`confidence_interval` must be between 0 and 1 (exclusive)&#34;: [&#34;&#34;], &#34;lower percentile must be greater than 0 and less than 100. Must be lower than upper percentile.&#34;: [&#34;&#34;], &#34;upper percentile must be greater than 0 and less than 100. Must be higher than lower percentile.&#34;: [&#34;&#34;], &#34;`width` must be greater or equal to 0&#34;: [&#34;&#34;], &#34;`row_limit` must be greater than or equal to 1&#34;: [&#34;&#34;], &#34;`row_offset` must be greater than or equal to 0&#34;: [&#34;&#34;], &#34;There are associated alerts or reports: %s,&#34;: [&#34;&#34;], &#34;Database does not exist&#34;: [&#34;&#34;], &#34;Dashboards do not exist&#34;: [&#34;&#34;], &#34;Datasource type is required when datasource_id is given&#34;: [&#34;&#34;], &#34;Chart parameters are invalid.&#34;: [&#34;&#34;], &#34;Chart could not be created.&#34;: [&#34;&#34;], &#34;Chart could not be updated.&#34;: [&#34;&#34;], &#34;Chart could not be deleted.&#34;: [&#34;&#34;], &#34;There are associated alerts or reports&#34;: [&#34;&#34;], &#34;Changing this chart is forbidden&#34;: [&#34;&#34;], &#34;Charts could not be deleted.&#34;: [&#34;&#34;], &#34;Import chart failed for an unknown reason&#34;: [&#34;&#34;], &#34;Owners are invalid&#34;: [&#34;&#34;], &#34;Dataset does not exist&#34;: [&#34;&#34;], &#34;`operation` property of post processing object undefined&#34;: [&#34;&#34;], &#34;Unsupported post processing operation: %(operation)s&#34;: [&#34;&#34;], &#34;Adding new datasource [{}]&#34;: [&#34;&#34;], &#34;Refreshing datasource [{}]&#34;: [&#34;&#34;], &#34;Metric(s) {} must be aggregations.&#34;: [&#34;&#34;], &#34;Unsupported extraction function: &#34;: [&#34;&#34;], &#34;Columns&#34;: [&#34;&#34;], &#34;Show Druid Column&#34;: [&#34;&#34;], &#34;Add Druid Column&#34;: [&#34;&#34;], &#34;Edit Druid Column&#34;: [&#34;&#34;], &#34;Column&#34;: [&#34;&#34;], &#34;Type&#34;: [&#34;&#34;], &#34;Datasource&#34;: [&#34;&#34;], &#34;Groupable&#34;: [&#34;&#34;], &#34;Filterable&#34;: [&#34;&#34;], &#34;Whether this column is exposed in the `Filters` section of the explore view.&#34;: [&#34;&#34;], &#34;Metrics&#34;: [&#34;&#34;], &#34;Show Druid Metric&#34;: [&#34;&#34;], &#34;Add Druid Metric&#34;: [&#34;&#34;], &#34;Edit Druid Metric&#34;: [&#34;&#34;], &#34;Metric&#34;: [&#34;&#34;], &#34;Description&#34;: [&#34;&#34;], &#34;Verbose Name&#34;: [&#34;&#34;], &#34;JSON&#34;: [&#34;&#34;], &#34;Druid Datasource&#34;: [&#34;&#34;], &#34;Warning Message&#34;: [&#34;&#34;], &#34;Show Druid Cluster&#34;: [&#34;&#34;], &#34;Add Druid Cluster&#34;: [&#34;&#34;], &#34;Edit Druid Cluster&#34;: [&#34;&#34;], &#34;Cluster Name&#34;: [&#34;&#34;], &#34;Broker Host&#34;: [&#34;&#34;], &#34;Broker Port&#34;: [&#34;&#34;], &#34;Broker Username&#34;: [&#34;&#34;], &#34;Broker Password&#34;: [&#34;&#34;], &#34;Broker Endpoint&#34;: [&#34;&#34;], &#34;Cache Timeout&#34;: [&#34;&#34;], &#34;Metadata Last Refreshed&#34;: [&#34;&#34;], &#34;Duration (in seconds) of the caching timeout for this cluster. A timeout of 0 indicates that the cache never expires. Note this defaults to the global timeout if undefined.&#34;: [&#34;&#34;], &#34;Druid supports basic authentication. See [auth](http://druid.io/docs/latest/design/auth.html) and druid-basic-security extension&#34;: [&#34;&#34;], &#34;Show Druid Datasource&#34;: [&#34;&#34;], &#34;Add Druid Datasource&#34;: [&#34;&#34;], &#34;Edit Druid Datasource&#34;: [&#34;&#34;], &#34;The list of charts associated with this table. By altering this datasource, you may change how these associated charts behave. Also note that charts need to point to a datasource, so this form will fail at saving if removing charts from a datasource. If you want to change the datasource for a chart, overwrite the chart from the &#39;explore view&#39;&#34;: [&#34;&#34;], &#34;Timezone offset (in hours) for this datasource&#34;: [&#34;&#34;], &#34;Time expression to use as a predicate when retrieving distinct values to populate the filter component. Only applies when `Enable Filter Select` is on. If you enter `7 days ago`, the distinct list of values in the filter will be populated based on the distinct value over the past week&#34;: [&#34;&#34;], &#34;Whether to populate the filter&#39;s dropdown in the explore view&#39;s filter section with a list of distinct values fetched from the backend on the fly&#34;: [&#34;&#34;], &#34;Redirects to this endpoint when clicking on the datasource from the datasource list&#34;: [&#34;&#34;], &#34;Duration (in seconds) of the caching timeout for this datasource. A timeout of 0 indicates that the cache never expires. Note this defaults to the cluster timeout if undefined.&#34;: [&#34;&#34;], &#34;Associated Charts&#34;: [&#34;&#34;], &#34;Data Source&#34;: [&#34;&#34;], &#34;Cluster&#34;: [&#34;&#34;], &#34;Owners&#34;: [&#34;&#34;], &#34;Is Hidden&#34;: [&#34;&#34;], &#34;Enable Filter Select&#34;: [&#34;&#34;], &#34;Default Endpoint&#34;: [&#34;&#34;], &#34;Time Offset&#34;: [&#34;&#34;], &#34;Datasource Name&#34;: [&#34;&#34;], &#34;Fetch Values From&#34;: [&#34;&#34;], &#34;Changed By&#34;: [&#34;&#34;], &#34;Modified&#34;: [&#34;&#34;], &#34;Refreshed metadata from cluster [{}]&#34;: [&#34;&#34;], &#34;Only `SELECT` statements are allowed&#34;: [&#34;&#34;], &#34;Only single queries supported&#34;: [&#34;&#34;], &#34;Error in jinja expression in fetch values predicate: %(msg)s&#34;: [&#34;&#34;], &#34;Error in jinja expression in FROM clause: %(msg)s&#34;: [&#34;&#34;], &#34;Virtual dataset query cannot consist of multiple statements&#34;: [&#34;&#34;], &#34;Virtual dataset query must be read-only&#34;: [&#34;&#34;], &#34;Error in jinja expression in RLS filters: %(msg)s&#34;: [&#34;&#34;], &#34;Datetime column not provided as part table configuration and is required by this type of chart&#34;: [&#34;&#34;], &#34;Empty query?&#34;: [&#34;&#34;], &#34;Metric &#39;%(metric)s&#39; does not exist&#34;: [&#34;&#34;], &#34;Invalid filter operation type: %(op)s&#34;: [&#34;&#34;], &#34;Error in jinja expression in WHERE clause: %(msg)s&#34;: [&#34;&#34;], &#34;Error in jinja expression in HAVING clause: %(msg)s&#34;: [&#34;&#34;], &#34;Show Column&#34;: [&#34;&#34;], &#34;Add Column&#34;: [&#34;&#34;], &#34;Edit Column&#34;: [&#34;&#34;], &#34;Whether to make this column available as a [Time Granularity] option, column has to be DATETIME or DATETIME-like&#34;: [&#34;&#34;], &#34;The data type that was inferred by the database. It may be necessary to input a type manually for expression-defined columns in some cases. In most case users should not need to alter this.&#34;: [&#34;&#34;], &#34;Table&#34;: [&#34;&#34;], &#34;Expression&#34;: [&#34;&#34;], &#34;Is temporal&#34;: [&#34;&#34;], &#34;Datetime Format&#34;: [&#34;&#34;], &#34;Invalid date/timestamp format&#34;: [&#34;&#34;], &#34;Show Metric&#34;: [&#34;&#34;], &#34;Add Metric&#34;: [&#34;&#34;], &#34;Edit Metric&#34;: [&#34;&#34;], &#34;SQL Expression&#34;: [&#34;&#34;], &#34;D3 Format&#34;: [&#34;&#34;], &#34;Extra&#34;: [&#34;&#34;], &#34;Row level security filter&#34;: [&#34;&#34;], &#34;Show Row level security filter&#34;: [&#34;&#34;], &#34;Add Row level security filter&#34;: [&#34;&#34;], &#34;Edit Row level security filter&#34;: [&#34;&#34;], &#34;Regular filters add where clauses to queries if a user belongs to a role referenced in the filter. Base filters apply filters to all queries except the roles defined in the filter, and can be used to define what users can see if no RLS filters within a filter group apply to them.&#34;: [&#34;&#34;], &#34;These are the tables this filter will be applied to.&#34;: [&#34;&#34;], &#34;For regular filters, these are the roles this filter will be applied to. For base filters, these are the roles that the filter DOES NOT apply to, e.g. Admin if admin should see all data.&#34;: [&#34;&#34;], &#34;Filters with the same group key will be ORed together within the group, while different filter groups will be ANDed together. Undefined group keys are treated as unique groups, i.e. are not grouped together. For example, if a table has three filters, of which two are for departments Finance and Marketing (group key = &#39;department&#39;), and one refers to the region Europe (group key = &#39;region&#39;), the filter clause would apply the filter (department = &#39;Finance&#39; OR department = &#39;Marketing&#39;) AND (region = &#39;Europe&#39;).&#34;: [&#34;&#34;], &#34;This is the condition that will be added to the WHERE clause. For example, to only return rows for a particular client, you might define a regular filter with the clause `client_id = 9`. To display no rows unless a user belongs to a RLS filter role, a base filter can be created with the clause `1 = 0` (always false).&#34;: [&#34;&#34;], &#34;Tables&#34;: [&#34;&#34;], &#34;Roles&#34;: [&#34;&#34;], &#34;Clause&#34;: [&#34;&#34;], &#34;Creator&#34;: [&#34;&#34;], &#34;Show Table&#34;: [&#34;&#34;], &#34;Import a table definition&#34;: [&#34;&#34;], &#34;Edit Table&#34;: [&#34;&#34;], &#34;Name of the table that exists in the source database&#34;: [&#34;&#34;], &#34;Schema, as used only in some databases like Postgres, Redshift and DB2&#34;: [&#34;&#34;], &#34;This fields acts a Superset view, meaning that Superset will run a query against this string as a subquery.&#34;: [&#34;&#34;], &#34;Predicate applied when fetching distinct value to populate the filter control component. Supports jinja template syntax. Applies only when `Enable Filter Select` is on.&#34;: [&#34;&#34;], &#34;Redirects to this endpoint when clicking on the table from the table list&#34;: [&#34;&#34;], &#34;Whether the table was generated by the &#39;Visualize&#39; flow in SQL Lab&#34;: [&#34;&#34;], &#34;A set of parameters that become available in the query using Jinja templating syntax&#34;: [&#34;&#34;], &#34;Duration (in seconds) of the caching timeout for this table. A timeout of 0 indicates that the cache never expires. Note this defaults to the database timeout if undefined.&#34;: [&#34;&#34;], &#34;Database&#34;: [&#34;&#34;], &#34;Last Changed&#34;: [&#34;&#34;], &#34;Schema&#34;: [&#34;&#34;], &#34;Offset&#34;: [&#34;&#34;], &#34;Table Name&#34;: [&#34;&#34;], &#34;Fetch Values Predicate&#34;: [&#34;&#34;], &#34;Main Datetime Column&#34;: [&#34;&#34;], &#34;SQL Lab View&#34;: [&#34;&#34;], &#34;Template parameters&#34;: [&#34;&#34;], &#34;The table was created. As part of this two-phase configuration process, you should now click the edit button by the new table to configure it.&#34;: [&#34;&#34;], &#34;Refresh Metadata&#34;: [&#34;&#34;], &#34;Refresh column metadata&#34;: [&#34;&#34;], &#34;Metadata refreshed for the following table(s): %(tables)s&#34;: [&#34;&#34;], &#34;The following tables added new columns: %(tables)s&#34;: [&#34;&#34;], &#34;The following tables removed columns: %(tables)s&#34;: [&#34;&#34;], &#34;The following tables update column metadata: %(tables)s&#34;: [&#34;&#34;], &#34;Unable to refresh metadata for the following table(s): %(tables)s&#34;: [&#34;&#34;], &#34;Deleted %(num)d css template&#34;: [&#34;&#34;, &#34;Deleted %(num)d css templates&#34;], &#34;CSS template could not be deleted.&#34;: [&#34;&#34;], &#34;CSS template not found.&#34;: [&#34;&#34;], &#34;Deleted %(num)d dashboard&#34;: [&#34;&#34;, &#34;Deleted %(num)d dashboards&#34;], &#34;Title or Slug&#34;: [&#34;&#34;], &#34;Must be unique&#34;: [&#34;&#34;], &#34;Dashboard parameters are invalid.&#34;: [&#34;&#34;], &#34;Dashboard not found.&#34;: [&#34;&#34;], &#34;Dashboard could not be created.&#34;: [&#34;&#34;], &#34;Dashboards could not be deleted.&#34;: [&#34;&#34;], &#34;Dashboard could not be updated.&#34;: [&#34;&#34;], &#34;Dashboard could not be deleted.&#34;: [&#34;&#34;], &#34;Changing this Dashboard is forbidden&#34;: [&#34;&#34;], &#34;Import dashboard failed for an unknown reason&#34;: [&#34;&#34;], &#34;No data in file&#34;: [&#34;&#34;], &#34;Table name undefined&#34;: [&#34;&#34;], &#34;Invalid connection string, a valid string usually follows: driver://user:password@database-host/database-name&#34;: [&#34;&#34;], &#34;SQLite database cannot be used as a data source for security reasons.&#34;: [&#34;&#34;], &#34;Field cannot be decoded by JSON. %(msg)s&#34;: [&#34;&#34;], &#34;The metadata_params in Extra field is not configured correctly. The key %(key)s is invalid.&#34;: [&#34;&#34;], &#34;Database parameters are invalid.&#34;: [&#34;&#34;], &#34;A database with the same name already exists&#34;: [&#34;&#34;], &#34;Field is required&#34;: [&#34;&#34;], &#34;Field cannot be decoded by JSON.  %{json_error}s&#34;: [&#34;&#34;], &#34;The metadata_params in Extra field is not configured correctly. The key %{key}s is invalid.&#34;: [&#34;&#34;], &#34;Database not found.&#34;: [&#34;&#34;], &#34;Database could not be created.&#34;: [&#34;&#34;], &#34;Database could not be updated.&#34;: [&#34;&#34;], &#34;Connection failed, please check your connection settings&#34;: [&#34;&#34;], &#34;Cannot delete a database that has tables attached&#34;: [&#34;&#34;], &#34;Database could not be deleted.&#34;: [&#34;&#34;], &#34;Stopped an unsafe database connection&#34;: [&#34;&#34;], &#34;Could not load database driver&#34;: [&#34;&#34;], &#34;Unexpected error occurred, please check your logs for details&#34;: [&#34;&#34;], &#34;Import database failed for an unknown reason&#34;: [&#34;&#34;], &#34;Could not load database driver: {}&#34;: [&#34;&#34;], &#34;Deleted %(num)d dataset&#34;: [&#34;&#34;, &#34;Deleted %(num)d datasets&#34;], &#34;Null or Empty&#34;: [&#34;&#34;], &#34;Database not allowed to change&#34;: [&#34;&#34;], &#34;One or more columns do not exist&#34;: [&#34;&#34;], &#34;One or more columns are duplicated&#34;: [&#34;&#34;], &#34;One or more columns already exist&#34;: [&#34;&#34;], &#34;One or more metrics do not exist&#34;: [&#34;&#34;], &#34;One or more metrics are duplicated&#34;: [&#34;&#34;], &#34;One or more metrics already exist&#34;: [&#34;&#34;], &#34;Table [%(table_name)s] could not be found, please double check your database connection, schema, and table name&#34;: [&#34;&#34;], &#34;Dataset parameters are invalid.&#34;: [&#34;&#34;], &#34;Dataset could not be created.&#34;: [&#34;&#34;], &#34;Dataset could not be updated.&#34;: [&#34;&#34;], &#34;Dataset could not be deleted.&#34;: [&#34;&#34;], &#34;Dataset(s) could not be bulk deleted.&#34;: [&#34;&#34;], &#34;Changing this dataset is forbidden&#34;: [&#34;&#34;], &#34;Import dataset failed for an unknown reason&#34;: [&#34;&#34;], &#34;Unknown Presto Error&#34;: [&#34;&#34;], &#34;We can&#39;t seem to resolve the column \&#34;%(column_name)s\&#34; at line %(location)s.&#34;: [&#34;&#34;], &#34;The table \&#34;%(table_name)s\&#34; does not exist. A valid table must be used to run this query.&#34;: [&#34;&#34;], &#34;Deleted %(num)d saved query&#34;: [&#34;&#34;, &#34;Deleted %(num)d saved queries&#34;], &#34;Saved queries could not be deleted.&#34;: [&#34;&#34;], &#34;Saved query not found.&#34;: [&#34;&#34;], &#34;Deleted %(num)d report schedule&#34;: [&#34;&#34;, &#34;Deleted %(num)d report schedules&#34;], &#34;Alert query returned more than one row. %s rows returned&#34;: [&#34;&#34;], &#34;Alert query returned more than one column. %s columns returned&#34;: [&#34;&#34;], &#34;Dashboard does not exist&#34;: [&#34;&#34;], &#34;Chart does not exist&#34;: [&#34;&#34;], &#34;Database is required for alerts&#34;: [&#34;&#34;], &#34;Type is required&#34;: [&#34;&#34;], &#34;Choose a chart or dashboard not both&#34;: [&#34;&#34;], &#34;Report Schedule parameters are invalid.&#34;: [&#34;&#34;], &#34;Report Schedule could not be deleted.&#34;: [&#34;&#34;], &#34;Report Schedule could not be created.&#34;: [&#34;&#34;], &#34;Report Schedule could not be updated.&#34;: [&#34;&#34;], &#34;Report Schedule not found.&#34;: [&#34;&#34;], &#34;Report Schedule delete failed.&#34;: [&#34;&#34;], &#34;Report Schedule log prune failed.&#34;: [&#34;&#34;], &#34;Report Schedule execution failed when generating a screenshot.&#34;: [&#34;&#34;], &#34;Report Schedule execution got an unexpected error.&#34;: [&#34;&#34;], &#34;Report Schedule is still working, refusing to re-compute.&#34;: [&#34;&#34;], &#34;Report Schedule reached a working timeout.&#34;: [&#34;&#34;], &#34;Alert query returned more than one row.&#34;: [&#34;&#34;], &#34;Alert validator config error.&#34;: [&#34;&#34;], &#34;Alert query returned more than one column.&#34;: [&#34;&#34;], &#34;Alert query returned a non-number value.&#34;: [&#34;&#34;], &#34;Alert found an error while executing a query.&#34;: [&#34;&#34;], &#34;Alert fired during grace period.&#34;: [&#34;&#34;], &#34;Alert ended grace period.&#34;: [&#34;&#34;], &#34;Alert on grace period&#34;: [&#34;&#34;], &#34;Report Schedule sellenium user not found&#34;: [&#34;&#34;], &#34;Report Schedule state not found&#34;: [&#34;&#34;], &#34;Report schedule unexpected error&#34;: [&#34;&#34;], &#34;Changing this report is forbidden&#34;: [&#34;&#34;], &#34;An error occurred while pruning logs &#34;: [&#34;&#34;], &#34;\n            &lt;b&gt;&lt;a href=\&#34;%(url)s\&#34;&gt;Explore in Superset&lt;/a&gt;&lt;/b&gt;&lt;p&gt;&lt;/p&gt;\n            &lt;img src=\&#34;cid:%(msgid)s\&#34;&gt;\n            &#34;: [&#34;&#34;], &#34;%(prefix)s %(title)s&#34;: [&#34;&#34;], &#34;\n            *%(name)s*\n\n            &lt;%(url)s|Explore in Superset&gt;\n            &#34;: [&#34;&#34;], &#34;\n        *%(name)s*\n\n        &lt;%(url)s|Explore in Superset&gt;\n        &#34;: [&#34;&#34;], &#34;&lt;b&gt;&lt;a href=\&#34;%(url)s\&#34;&gt;Explore in Superset&lt;/a&gt;&lt;/b&gt;&lt;p&gt;&lt;/p&gt;&#34;: [&#34;&#34;], &#34;%(name)s.csv&#34;: [&#34;&#34;], &#34;\n        *%(slice_name)s*\n\n        &lt;%(slice_url_user_friendly)s|Explore in Superset&gt;\n        &#34;: [&#34;&#34;], &#34;[Alert] %(label)s&#34;: [&#34;&#34;], &#34;New&#34;: [&#34;&#34;], &#34;SQL Query&#34;: [&#34;&#34;], &#34;Chart&#34;: [&#34;&#34;], &#34;Dashboard&#34;: [&#34;&#34;], &#34;Profile&#34;: [&#34;&#34;], &#34;Info&#34;: [&#34;&#34;], &#34;Logout&#34;: [&#34;&#34;], &#34;Login&#34;: [&#34;&#34;], &#34;Record Count&#34;: [&#34;&#34;], &#34;No records found&#34;: [&#34;&#34;], &#34;Filter List&#34;: [&#34;&#34;], &#34;Search&#34;: [&#34;&#34;], &#34;Refresh&#34;: [&#34;&#34;], &#34;Import dashboards&#34;: [&#34;&#34;], &#34;Import Dashboard(s)&#34;: [&#34;&#34;], &#34;File&#34;: [&#34;&#34;], &#34;Choose File&#34;: [&#34;&#34;], &#34;Upload&#34;: [&#34;&#34;], &#34;No Access!&#34;: [&#34;&#34;], &#34;You do not have permissions to access the datasource(s): %(name)s.&#34;: [&#34;&#34;], &#34;Request Permissions&#34;: [&#34;&#34;], &#34;Cancel&#34;: [&#34;&#34;], &#34;Use the edit buttom to change this field&#34;: [&#34;&#34;], &#34;Test Connection&#34;: [&#34;&#34;], &#34;[Superset] Access to the datasource %(name)s was granted&#34;: [&#34;&#34;], &#34;Unable to find such a holiday: [{}]&#34;: [&#34;&#34;], &#34;Referenced columns not available in DataFrame.&#34;: [&#34;&#34;], &#34;Column referenced by aggregate is undefined: %(column)s&#34;: [&#34;&#34;], &#34;Operator undefined for aggregator: %(name)s&#34;: [&#34;&#34;], &#34;Invalid numpy function: %(operator)s&#34;: [&#34;&#34;], &#34;Pivot operation requires at least one index&#34;: [&#34;&#34;], &#34;Pivot operation must include at least one aggregate&#34;: [&#34;&#34;], &#34;Undefined window for rolling operation&#34;: [&#34;&#34;], &#34;Invalid rolling_type: %(type)s&#34;: [&#34;&#34;], &#34;Invalid options for %(rolling_type)s: %(options)s&#34;: [&#34;&#34;], &#34;Invalid cumulative operator: %(operator)s&#34;: [&#34;&#34;], &#34;Invalid geohash string&#34;: [&#34;&#34;], &#34;Invalid longitude/latitude&#34;: [&#34;&#34;], &#34;Invalid geodetic string&#34;: [&#34;&#34;], &#34;`fbprophet` package not installed&#34;: [&#34;&#34;], &#34;Time grain missing&#34;: [&#34;&#34;], &#34;Unsupported time grain: %(time_grain)s&#34;: [&#34;&#34;], &#34;Periods must be a positive integer value&#34;: [&#34;&#34;], &#34;Confidence interval must be between 0 and 1 (exclusive)&#34;: [&#34;&#34;], &#34;DataFrame must include temporal column&#34;: [&#34;&#34;], &#34;DataFrame include at least one series&#34;: [&#34;&#34;], &#34;percentiles must be a list or tuple with two numeric values, of which the first is lower than the second value&#34;: [&#34;&#34;], &#34;User&#34;: [&#34;&#34;], &#34;User Roles&#34;: [&#34;&#34;], &#34;Database URL&#34;: [&#34;&#34;], &#34;Roles to grant&#34;: [&#34;&#34;], &#34;Created On&#34;: [&#34;&#34;], &#34;List Observations&#34;: [&#34;&#34;], &#34;Show Observation&#34;: [&#34;&#34;], &#34;Error Message&#34;: [&#34;&#34;], &#34;Log Retentions (days)&#34;: [&#34;&#34;], &#34;A semicolon &#39;;&#39; delimited list of email addresses&#34;: [&#34;&#34;], &#34;How long to keep the logs around for this alert&#34;: [&#34;&#34;], &#34;Once an alert is triggered, how long, in seconds, before Superset nags you again.&#34;: [&#34;&#34;], &#34;A SQL statement that defines whether the alert should get triggered or not. The query is expected to return either NULL or a number value.&#34;: [&#34;&#34;], &#34;annotation start time or end time is required.&#34;: [&#34;&#34;], &#34;Annotation end time must be no earlier than start time.&#34;: [&#34;&#34;], &#34;Annotations&#34;: [&#34;&#34;], &#34;Show Annotation&#34;: [&#34;&#34;], &#34;Add Annotation&#34;: [&#34;&#34;], &#34;Edit Annotation&#34;: [&#34;&#34;], &#34;Layer&#34;: [&#34;&#34;], &#34;Label&#34;: [&#34;&#34;], &#34;Start&#34;: [&#34;&#34;], &#34;End&#34;: [&#34;&#34;], &#34;JSON Metadata&#34;: [&#34;&#34;], &#34;Show Annotation Layer&#34;: [&#34;&#34;], &#34;Add Annotation Layer&#34;: [&#34;&#34;], &#34;Edit Annotation Layer&#34;: [&#34;&#34;], &#34;Name&#34;: [&#34;&#34;], &#34;Dataset %(name)s already exists&#34;: [&#34;&#34;], &#34;Table [%{table}s] could not be found, please double check your database connection, schema, and table name, error: {}&#34;: [&#34;&#34;], &#34;json isn&#39;t valid&#34;: [&#34;&#34;], &#34;Export to YAML&#34;: [&#34;&#34;], &#34;Export to YAML?&#34;: [&#34;&#34;], &#34;Delete&#34;: [&#34;&#34;], &#34;Delete all Really?&#34;: [&#34;&#34;], &#34;Is favorite&#34;: [&#34;&#34;], &#34;The data source seems to have been deleted&#34;: [&#34;&#34;], &#34;The user seems to have been deleted&#34;: [&#34;&#34;], &#34;Access was requested&#34;: [&#34;&#34;], &#34;The access requests seem to have been deleted&#34;: [&#34;&#34;], &#34;%(user)s was granted the role %(role)s that gives access to the %(datasource)s&#34;: [&#34;&#34;], &#34;Role %(r)s was extended to provide the access to the datasource %(ds)s&#34;: [&#34;&#34;], &#34;You have no permission to approve this request&#34;: [&#34;&#34;], &#34;Cannot import dashboard: %(db_error)s.\nMake sure to create the database before importing the dashboard.&#34;: [&#34;&#34;], &#34;An unknown error occurred. Please contact your Superset administrator&#34;: [&#34;&#34;], &#34;Error occurred when opening the chart: %(error)s&#34;: [&#34;&#34;], &#34;You don&#39;t have the rights to &#34;: [&#34;&#34;], &#34;alter this &#34;: [&#34;&#34;], &#34;chart&#34;: [&#34;&#34;], &#34;create a &#34;: [&#34;&#34;], &#34;Explore - %(table)s&#34;: [&#34;&#34;], &#34;Chart [{}] has been saved&#34;: [&#34;&#34;], &#34;Chart [{}] has been overwritten&#34;: [&#34;&#34;], &#34;dashboard&#34;: [&#34;&#34;], &#34;Chart [{}] was added to dashboard [{}]&#34;: [&#34;&#34;], &#34;Dashboard [{}] just got created and chart [{}] was added to it&#34;: [&#34;&#34;], &#34;This dashboard was changed recently. Please reload dashboard to get latest version.&#34;: [&#34;&#34;], &#34;Could not load database driver: %(driver_name)s&#34;: [&#34;&#34;], &#34;Invalid connection string, a valid string usually follows:\n&#39;DRIVER://USER:PASSWORD@DB-HOST/DATABASE-NAME&#39;&#34;: [&#34;&#34;], &#34;Malformed request. slice_id or table_name and db_name arguments are expected&#34;: [&#34;&#34;], &#34;Chart %(id)s not found&#34;: [&#34;&#34;], &#34;Table %(table)s wasn&#39;t found in the database %(db)s&#34;: [&#34;&#34;], &#34;Can&#39;t find User &#39;%(name)s&#39;, please ask your admin to create one.&#34;: [&#34;&#34;], &#34;Can&#39;t find DruidCluster with cluster_name = &#39;%(name)s&#39;&#34;: [&#34;&#34;], &#34;Data could not be deserialized. You may want to re-run the query.&#34;: [&#34;&#34;], &#34;%(validator)s was unable to check your query.\nPlease recheck your query.\nException: %(ex)s&#34;: [&#34;&#34;], &#34;Failed to start remote query on a worker. Tell your administrator to verify the availability of the message queue.&#34;: [&#34;&#34;], &#34;Query record was not created as expected.&#34;: [&#34;&#34;], &#34;The parameter %(parameters)s in your query is undefined.&#34;: [&#34;&#34;, &#34;The following parameters in your query are undefined: %(parameters)s.&#34;], &#34;%(user)s&#39;s profile&#34;: [&#34;&#34;], &#34;Show CSS Template&#34;: [&#34;&#34;], &#34;Add CSS Template&#34;: [&#34;&#34;], &#34;Edit CSS Template&#34;: [&#34;&#34;], &#34;Template Name&#34;: [&#34;&#34;], &#34;A human-friendly name&#34;: [&#34;&#34;], &#34;Used internally to identify the plugin. Should be set to the package name from the plugin\u02bcs package.json&#34;: [&#34;&#34;], &#34;A full URL pointing to the location of the built plugin (could be hosted on a CDN for example)&#34;: [&#34;&#34;], &#34;Custom Plugins&#34;: [&#34;&#34;], &#34;Custom Plugin&#34;: [&#34;&#34;], &#34;Add a Plugin&#34;: [&#34;&#34;], &#34;Edit Plugin&#34;: [&#34;&#34;], &#34;Schedule Email Reports for Dashboards&#34;: [&#34;&#34;], &#34;Manage Email Reports for Dashboards&#34;: [&#34;&#34;], &#34;Changed On&#34;: [&#34;&#34;], &#34;Active&#34;: [&#34;&#34;], &#34;Crontab&#34;: [&#34;&#34;], &#34;Recipients&#34;: [&#34;&#34;], &#34;Slack Channel&#34;: [&#34;&#34;], &#34;Deliver As Group&#34;: [&#34;&#34;], &#34;Delivery Type&#34;: [&#34;&#34;], &#34;Schedule Email Reports for Charts&#34;: [&#34;&#34;], &#34;Manage Email Reports for Charts&#34;: [&#34;&#34;], &#34;Email Format&#34;: [&#34;&#34;], &#34;List Saved Query&#34;: [&#34;&#34;], &#34;Show Saved Query&#34;: [&#34;&#34;], &#34;Add Saved Query&#34;: [&#34;&#34;], &#34;Edit Saved Query&#34;: [&#34;&#34;], &#34;End Time&#34;: [&#34;&#34;], &#34;Pop Tab Link&#34;: [&#34;&#34;], &#34;Changed on&#34;: [&#34;&#34;], &#34;Could not determine datasource type&#34;: [&#34;&#34;], &#34;Could not find viz object&#34;: [&#34;&#34;], &#34;Show Chart&#34;: [&#34;&#34;], &#34;Add Chart&#34;: [&#34;&#34;], &#34;Edit Chart&#34;: [&#34;&#34;], &#34;These parameters are generated dynamically when clicking the save or overwrite button in the explore view. This JSON object is exposed here for reference and for power users who may want to alter specific parameters.&#34;: [&#34;&#34;], &#34;Duration (in seconds) of the caching timeout for this chart. Note this defaults to the datasource/table timeout if undefined.&#34;: [&#34;&#34;], &#34;Last Modified&#34;: [&#34;&#34;], &#34;Parameters&#34;: [&#34;&#34;], &#34;Visualization Type&#34;: [&#34;&#34;], &#34;Show Dashboard&#34;: [&#34;&#34;], &#34;Add Dashboard&#34;: [&#34;&#34;], &#34;Edit Dashboard&#34;: [&#34;&#34;], &#34;This json object describes the positioning of the widgets in the dashboard. It is dynamically generated when adjusting the widgets size and positions by using drag &amp; drop in the dashboard view&#34;: [&#34;&#34;], &#34;The CSS for individual dashboards can be altered here, or in the dashboard view where changes are immediately visible&#34;: [&#34;&#34;], &#34;To get a readable URL for your dashboard&#34;: [&#34;&#34;], &#34;This JSON object is generated dynamically when clicking the save or overwrite button in the dashboard view. It is exposed here for reference and for power users who may want to alter specific parameters.&#34;: [&#34;&#34;], &#34;Owners is a list of users who can alter the dashboard.&#34;: [&#34;&#34;], &#34;Determines whether or not this dashboard is visible in the list of all dashboards&#34;: [&#34;&#34;], &#34;Title&#34;: [&#34;&#34;], &#34;Slug&#34;: [&#34;&#34;], &#34;Published&#34;: [&#34;&#34;], &#34;Position JSON&#34;: [&#34;&#34;], &#34;CSS&#34;: [&#34;&#34;], &#34;Underlying Tables&#34;: [&#34;&#34;], &#34;Export&#34;: [&#34;&#34;], &#34;Export dashboards?&#34;: [&#34;&#34;], &#34;Name of table to be created from csv data.&#34;: [&#34;&#34;], &#34;CSV File&#34;: [&#34;&#34;], &#34;Select a CSV file to be uploaded to a database.&#34;: [&#34;&#34;], &#34;Only the following file extensions are allowed: %(allowed_extensions)s&#34;: [&#34;&#34;], &#34;Specify a schema (if database flavor supports this).&#34;: [&#34;&#34;], &#34;Delimiter&#34;: [&#34;&#34;], &#34;Delimiter used by CSV file (for whitespace use \\s+).&#34;: [&#34;&#34;], &#34;Table Exists&#34;: [&#34;&#34;], &#34;If table exists do one of the following: Fail (do nothing), Replace (drop and recreate table) or Append (insert data).&#34;: [&#34;&#34;], &#34;Fail&#34;: [&#34;&#34;], &#34;Replace&#34;: [&#34;&#34;], &#34;Append&#34;: [&#34;&#34;], &#34;Header Row&#34;: [&#34;&#34;], &#34;Row containing the headers to use as column names (0 is first line of data). Leave empty if there is no header row.&#34;: [&#34;&#34;], &#34;Index Column&#34;: [&#34;&#34;], &#34;Column to use as the row labels of the dataframe. Leave empty if no index column.&#34;: [&#34;&#34;], &#34;Mangle Duplicate Columns&#34;: [&#34;&#34;], &#34;Specify duplicate columns as \&#34;X.0, X.1\&#34;.&#34;: [&#34;&#34;], &#34;Skip Initial Space&#34;: [&#34;&#34;], &#34;Skip spaces after delimiter.&#34;: [&#34;&#34;], &#34;Skip Rows&#34;: [&#34;&#34;], &#34;Number of rows to skip at start of file.&#34;: [&#34;&#34;], &#34;Rows to Read&#34;: [&#34;&#34;], &#34;Number of rows of file to read.&#34;: [&#34;&#34;], &#34;Skip Blank Lines&#34;: [&#34;&#34;], &#34;Skip blank lines rather than interpreting them as NaN values.&#34;: [&#34;&#34;], &#34;Parse Dates&#34;: [&#34;&#34;], &#34;A comma separated list of columns that should be parsed as dates.&#34;: [&#34;&#34;], &#34;Infer Datetime Format&#34;: [&#34;&#34;], &#34;Use Pandas to interpret the datetime format automatically.&#34;: [&#34;&#34;], &#34;Decimal Character&#34;: [&#34;&#34;], &#34;Character to interpret as decimal point.&#34;: [&#34;&#34;], &#34;Dataframe Index&#34;: [&#34;&#34;], &#34;Write dataframe index as a column.&#34;: [&#34;&#34;], &#34;Column Label(s)&#34;: [&#34;&#34;], &#34;Column label for index column(s). If None is given and Dataframe Index is True, Index Names are used.&#34;: [&#34;&#34;], &#34;Null values&#34;: [&#34;&#34;], &#34;Json list of the values that should be treated as null. Examples: [\&#34;\&#34;], [\&#34;None\&#34;, \&#34;N/A\&#34;], [\&#34;nan\&#34;, \&#34;null\&#34;]. Warning: Hive database supports only single value. Use [\&#34;\&#34;] for empty string.&#34;: [&#34;&#34;], &#34;Name of table to be created from excel data.&#34;: [&#34;&#34;], &#34;Excel File&#34;: [&#34;&#34;], &#34;Select a Excel file to be uploaded to a database.&#34;: [&#34;&#34;], &#34;Sheet Name&#34;: [&#34;&#34;], &#34;Strings used for sheet names (default is the first sheet).&#34;: [&#34;&#34;], &#34;Show Database&#34;: [&#34;&#34;], &#34;Add Database&#34;: [&#34;&#34;], &#34;Edit Database&#34;: [&#34;&#34;], &#34;Expose this DB in SQL Lab&#34;: [&#34;&#34;], &#34;Operate the database in asynchronous mode, meaning  that the queries are executed on remote workers as opposed to on the web server itself. This assumes that you have a Celery worker setup as well as a results backend. Refer to the installation docs for more information.&#34;: [&#34;&#34;], &#34;Allow CREATE TABLE AS option in SQL Lab&#34;: [&#34;&#34;], &#34;Allow CREATE VIEW AS option in SQL Lab&#34;: [&#34;&#34;], &#34;Allow users to run non-SELECT statements (UPDATE, DELETE, CREATE, ...) in SQL Lab&#34;: [&#34;&#34;], &#34;When allowing CREATE TABLE AS option in SQL Lab, this option forces the table to be created in this schema&#34;: [&#34;&#34;], &#34;If Presto, Trino or Drill all the queries in SQL Lab are going to be executed as the currently logged on user who must have permission to run them.&lt;br/&gt;If Hive and hive.server2.enable.doAs is enabled, will run the queries as service account, but impersonate the currently logged on user via hive.server2.proxy.user property.&#34;: [&#34;&#34;], &#34;Allow SQL Lab to fetch a list of all tables and all views across all database schemas. For large data warehouse with thousands of tables, this can be expensive and put strain on the system.&#34;: [&#34;&#34;], &#34;Duration (in seconds) of the caching timeout for charts of this database. A timeout of 0 indicates that the cache never expires. Note this defaults to the global timeout if undefined.&#34;: [&#34;&#34;], &#34;If selected, please set the schemas allowed for csv upload in Extra.&#34;: [&#34;&#34;], &#34;Expose in SQL Lab&#34;: [&#34;&#34;], &#34;Allow CREATE TABLE AS&#34;: [&#34;&#34;], &#34;Allow CREATE VIEW AS&#34;: [&#34;&#34;], &#34;Allow DML&#34;: [&#34;&#34;], &#34;CTAS Schema&#34;: [&#34;&#34;], &#34;SQLAlchemy URI&#34;: [&#34;&#34;], &#34;Chart Cache Timeout&#34;: [&#34;&#34;], &#34;Secure Extra&#34;: [&#34;&#34;], &#34;Root certificate&#34;: [&#34;&#34;], &#34;Async Execution&#34;: [&#34;&#34;], &#34;Impersonate the logged on user&#34;: [&#34;&#34;], &#34;Allow Csv Upload&#34;: [&#34;&#34;], &#34;Allow Multi Schema Metadata Fetch&#34;: [&#34;&#34;], &#34;Backend&#34;: [&#34;&#34;], &#34;Extra field cannot be decoded by JSON. %(msg)s&#34;: [&#34;&#34;], &#34;Invalid connection string, a valid string usually follows:&#39;DRIVER://USER:PASSWORD@DB-HOST/DATABASE-NAME&#39;&lt;p&gt;Example:&#39;postgresql://user:password@your-postgres-db/database&#39;&lt;/p&gt;&#34;: [&#34;&#34;], &#34;CSV to Database configuration&#34;: [&#34;&#34;], &#34;Database \&#34;%(database_name)s\&#34; schema \&#34;%(schema_name)s\&#34; is not allowed for csv uploads. Please contact your Superset Admin.&#34;: [&#34;&#34;], &#34;You cannot specify a namespace both in the name of the table: \&#34;%(csv_table.table)s\&#34; and in the schema field: \&#34;%(csv_table.schema)s\&#34;. Please remove one&#34;: [&#34;&#34;], &#34;Unable to upload CSV file \&#34;%(filename)s\&#34; to table \&#34;%(table_name)s\&#34; in database \&#34;%(db_name)s\&#34;. Error message: %(error_msg)s&#34;: [&#34;&#34;], &#34;CSV file \&#34;%(csv_filename)s\&#34; uploaded to table \&#34;%(table_name)s\&#34; in database \&#34;%(db_name)s\&#34;&#34;: [&#34;&#34;], &#34;Excel to Database configuration&#34;: [&#34;&#34;], &#34;Database \&#34;%(database_name)s\&#34; schema \&#34;%(schema_name)s\&#34; is not allowed for excel uploads. Please contact your Superset Admin.&#34;: [&#34;&#34;], &#34;You cannot specify a namespace both in the name of the table: \&#34;%(excel_table.table)s\&#34; and in the schema field: \&#34;%(excel_table.schema)s\&#34;. Please remove one&#34;: [&#34;&#34;], &#34;Unable to upload Excel file \&#34;%(filename)s\&#34; to table \&#34;%(table_name)s\&#34; in database \&#34;%(db_name)s\&#34;. Error message: %(error_msg)s&#34;: [&#34;&#34;], &#34;Excel file \&#34;%(excel_filename)s\&#34; uploaded to table \&#34;%(table_name)s\&#34; in database \&#34;%(db_name)s\&#34;&#34;: [&#34;&#34;], &#34;Logs&#34;: [&#34;&#34;], &#34;Show Log&#34;: [&#34;&#34;], &#34;Add Log&#34;: [&#34;&#34;], &#34;Edit Log&#34;: [&#34;&#34;], &#34;Action&#34;: [&#34;&#34;], &#34;dttm&#34;: [&#34;&#34;], &#34;Add item&#34;: [&#34;&#34;], &#34;The query couldn&#39;t be loaded&#34;: [&#34;&#34;], &#34;Your query has been scheduled. To see details of your query, navigate to Saved queries&#34;: [&#34;&#34;], &#34;Your query could not be scheduled&#34;: [&#34;&#34;], &#34;Failed at retrieving results&#34;: [&#34;&#34;], &#34;An error occurred while storing the latest query id in the backend. Please contact your administrator if this problem persists.&#34;: [&#34;&#34;], &#34;Unknown error&#34;: [&#34;&#34;], &#34;Query was stopped.&#34;: [&#34;&#34;], &#34;Unable to migrate table schema state to backend. Superset will retry later. Please contact your administrator if this problem persists.&#34;: [&#34;&#34;], &#34;Unable to migrate query state to backend. Superset will retry later. Please contact your administrator if this problem persists.&#34;: [&#34;&#34;], &#34;Unable to migrate query editor state to backend. Superset will retry later. Please contact your administrator if this problem persists.&#34;: [&#34;&#34;], &#34;Unable to add a new tab to the backend. Please contact your administrator.&#34;: [&#34;&#34;], &#34;Copy of %s&#34;: [&#34;&#34;], &#34;An error occurred while setting the active tab. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while fetching tab state&#34;: [&#34;&#34;], &#34;An error occurred while removing tab. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while removing query. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while setting the tab database ID. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while setting the tab schema. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while setting the tab autorun. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while setting the tab title. Please contact your administrator.&#34;: [&#34;&#34;], &#34;Your query was saved&#34;: [&#34;&#34;], &#34;Your query could not be saved&#34;: [&#34;&#34;], &#34;Your query was updated&#34;: [&#34;&#34;], &#34;Your query could not be updated&#34;: [&#34;&#34;], &#34;An error occurred while storing your query in the backend. To avoid losing your changes, please save your query using the \&#34;Save Query\&#34; button.&#34;: [&#34;&#34;], &#34;An error occurred while setting the tab template parameters. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while fetching table metadata&#34;: [&#34;&#34;], &#34;An error occurred while fetching table metadata. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while expanding the table schema. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while collapsing the table schema. Please contact your administrator.&#34;: [&#34;&#34;], &#34;An error occurred while removing the table schema. Please contact your administrator.&#34;: [&#34;&#34;], &#34;Shared query&#34;: [&#34;&#34;], &#34;The datasource couldn&#39;t be loaded&#34;: [&#34;&#34;], &#34;An error occurred while creating the data source&#34;: [&#34;&#34;], &#34;SQL Lab uses your browser&#39;s local storage to store queries and results.\n Currently, you are using ${currentUsage.toFixed(\n            2,\n          )} KB out of ${LOCALSTORAGE_MAX_USAGE_KB} KB. storage space.\n To keep SQL Lab from crashing, please delete some query tabs.\n You can re-access these queries by using the Save feature before you delete the tab. Note that you will need to close other SQL Lab windows before you do this.&#34;: [&#34;&#34;], &#34;Estimate selected query cost&#34;: [&#34;&#34;], &#34;Estimate cost&#34;: [&#34;&#34;], &#34;Cost estimate&#34;: [&#34;&#34;], &#34;Creating a data source and creating a new tab&#34;: [&#34;&#34;], &#34;An error occurred&#34;: [&#34;&#34;], &#34;Explore the result set in the data exploration view&#34;: [&#34;&#34;], &#34;Explore&#34;: [&#34;&#34;], &#34;This query took %s seconds to run, &#34;: [&#34;&#34;], &#34;and the explore view times out at %s seconds &#34;: [&#34;&#34;], &#34;following this flow will most likely lead to your query timing out. &#34;: [&#34;&#34;], &#34;We recommend your summarize your data further before following that flow. &#34;: [&#34;&#34;], &#34;If activated you can use the &#34;: [&#34;&#34;], &#34;feature to store a summarized data set that you can then explore.&#34;: [&#34;&#34;], &#34;Column name(s) &#34;: [&#34;&#34;], &#34;cannot be used as a column name. The column name/alias \&#34;__timestamp\&#34;\n          is reserved for the main temporal expression, and column aliases ending with\n          double underscores followed by a numeric value (e.g. \&#34;my_col__1\&#34;) are reserved\n          for deduplicating duplicate column names. Please use aliases to rename the\n          invalid column names.&#34;: [&#34;&#34;], &#34;Raw SQL&#34;: [&#34;&#34;], &#34;Source SQL&#34;: [&#34;&#34;], &#34;SQL&#34;: [&#34;&#34;], &#34;No query history yet...&#34;: [&#34;&#34;], &#34;It seems you don&#39;t have access to any database&#34;: [&#34;&#34;], &#34;An error occurred when refreshing queries&#34;: [&#34;&#34;], &#34;Filter by user&#34;: [&#34;&#34;], &#34;Filter by database&#34;: [&#34;&#34;], &#34;Query search string&#34;: [&#34;&#34;], &#34;[From]-&#34;: [&#34;&#34;], &#34;[To]-&#34;: [&#34;&#34;], &#34;Filter by status&#34;: [&#34;&#34;], &#34;Edit&#34;: [&#34;&#34;], &#34;View results&#34;: [&#34;&#34;], &#34;Data preview&#34;: [&#34;&#34;], &#34;Overwrite text in the editor with a query on this table&#34;: [&#34;&#34;], &#34;Run query in a new tab&#34;: [&#34;&#34;], &#34;Remove query from log&#34;: [&#34;&#34;], &#34;An error occurred saving dataset&#34;: [&#34;&#34;], &#34;.CSV&#34;: [&#34;&#34;], &#34;Clipboard&#34;: [&#34;&#34;], &#34;Filter results&#34;: [&#34;&#34;], &#34;Database error&#34;: [&#34;&#34;], &#34;was created&#34;: [&#34;&#34;], &#34;Query in a new tab&#34;: [&#34;&#34;], &#34;The query returned no data&#34;: [&#34;&#34;], &#34;Fetch data preview&#34;: [&#34;&#34;], &#34;Refetch results&#34;: [&#34;&#34;], &#34;Track job&#34;: [&#34;&#34;], &#34;Stop&#34;: [&#34;&#34;], &#34;Run selection&#34;: [&#34;&#34;], &#34;Run&#34;: [&#34;&#34;], &#34;Stop running (Ctrl + x)&#34;: [&#34;&#34;], &#34;Stop running (Ctrl + e)&#34;: [&#34;&#34;], &#34;Run query (Ctrl + Return)&#34;: [&#34;&#34;], &#34;Save &amp; Explore&#34;: [&#34;&#34;], &#34;Overwrite &amp; Explore&#34;: [&#34;&#34;], &#34;Undefined&#34;: [&#34;&#34;], &#34;Save&#34;: [&#34;&#34;], &#34;Save as&#34;: [&#34;&#34;], &#34;Save query&#34;: [&#34;&#34;], &#34;Save as new&#34;: [&#34;&#34;], &#34;Update&#34;: [&#34;&#34;], &#34;Label for your query&#34;: [&#34;&#34;], &#34;Write a description for your query&#34;: [&#34;&#34;], &#34;Schedule query&#34;: [&#34;&#34;], &#34;Schedule&#34;: [&#34;&#34;], &#34;There was an error with your request&#34;: [&#34;&#34;], &#34;Please save the query to enable sharing&#34;: [&#34;&#34;], &#34;Copy link&#34;: [&#34;&#34;], &#34;Copy query link to your clipboard&#34;: [&#34;&#34;], &#34;Save the query to copy the link&#34;: [&#34;&#34;], &#34;No stored results found, you need to re-run your query&#34;: [&#34;&#34;], &#34;Run a query to display results here&#34;: [&#34;&#34;], &#34;Preview: `%s`&#34;: [&#34;&#34;], &#34;Results&#34;: [&#34;&#34;], &#34;Query history&#34;: [&#34;&#34;], &#34;Run query&#34;: [&#34;&#34;], &#34;New tab&#34;: [&#34;&#34;], &#34;Untitled query&#34;: [&#34;&#34;], &#34;Stop query&#34;: [&#34;&#34;], &#34;Schedule the query periodically&#34;: [&#34;&#34;], &#34;You must run the query successfully first&#34;: [&#34;&#34;], &#34;It appears that the number of rows in the query results displayed\n           was limited on the server side to\n           the %s limit.&#34;: [&#34;&#34;], &#34;CREATE TABLE AS&#34;: [&#34;&#34;], &#34;CREATE VIEW AS&#34;: [&#34;&#34;], &#34;Estimate the cost before running a query&#34;: [&#34;&#34;], &#34;Reset state&#34;: [&#34;&#34;], &#34;Enter a new title for the tab&#34;: [&#34;&#34;], &#34;Untitled Query %s&#34;: [&#34;&#34;], &#34;Close tab&#34;: [&#34;&#34;], &#34;Rename tab&#34;: [&#34;&#34;], &#34;Expand tool bar&#34;: [&#34;&#34;], &#34;Hide tool bar&#34;: [&#34;&#34;], &#34;Close all other tabs&#34;: [&#34;&#34;], &#34;Duplicate tab&#34;: [&#34;&#34;], &#34;Copy partition query to clipboard&#34;: [&#34;&#34;], &#34;latest partition:&#34;: [&#34;&#34;], &#34;Keys for table&#34;: [&#34;&#34;], &#34;View keys &amp; indexes (%s)&#34;: [&#34;&#34;], &#34;Sort columns alphabetically&#34;: [&#34;&#34;], &#34;Original table column order&#34;: [&#34;&#34;], &#34;Copy SELECT statement to the clipboard&#34;: [&#34;&#34;], &#34;Show CREATE VIEW statement&#34;: [&#34;&#34;], &#34;CREATE VIEW statement&#34;: [&#34;&#34;], &#34;Remove table preview&#34;: [&#34;&#34;], &#34;Assign a set of parameters as&#34;: [&#34;&#34;], &#34;below (example:&#34;: [&#34;&#34;], &#34;), and they become available in your SQL (example:&#34;: [&#34;&#34;], &#34;) by using&#34;: [&#34;&#34;], &#34;Edit template parameters&#34;: [&#34;&#34;], &#34;Invalid JSON&#34;: [&#34;&#34;], &#34;Create a new chart&#34;: [&#34;&#34;], &#34;Choose a dataset&#34;: [&#34;&#34;], &#34;If the dataset you are looking for is not available in the list, follow the instructions on how to add it in the Superset tutorial.&#34;: [&#34;&#34;], &#34;Choose a visualization type&#34;: [&#34;&#34;], &#34;Create new chart&#34;: [&#34;&#34;], &#34;An error occurred while loading the SQL&#34;: [&#34;&#34;], &#34;Updating chart was stopped&#34;: [&#34;&#34;], &#34;An error occurred while rendering the visualization: %s&#34;: [&#34;&#34;], &#34;Network error.&#34;: [&#34;&#34;], &#34;every&#34;: [&#34;&#34;], &#34;every month&#34;: [&#34;&#34;], &#34;every day of the month&#34;: [&#34;&#34;], &#34;day of the month&#34;: [&#34;&#34;], &#34;every day of the week&#34;: [&#34;&#34;], &#34;day of the week&#34;: [&#34;&#34;], &#34;every hour&#34;: [&#34;&#34;], &#34;every minute UTC&#34;: [&#34;&#34;], &#34;year&#34;: [&#34;&#34;], &#34;month&#34;: [&#34;&#34;], &#34;week&#34;: [&#34;&#34;], &#34;day&#34;: [&#34;&#34;], &#34;hour&#34;: [&#34;&#34;], &#34;minute&#34;: [&#34;&#34;], &#34;reboot&#34;: [&#34;&#34;], &#34;Every&#34;: [&#34;&#34;], &#34;in&#34;: [&#34;&#34;], &#34;on&#34;: [&#34;&#34;], &#34;and&#34;: [&#34;&#34;], &#34;at&#34;: [&#34;&#34;], &#34;:&#34;: [&#34;&#34;], &#34;minute(s) UTC&#34;: [&#34;&#34;], &#34;Invalid cron expression&#34;: [&#34;&#34;], &#34;Clear&#34;: [&#34;&#34;], &#34;Sunday&#34;: [&#34;&#34;], &#34;Monday&#34;: [&#34;&#34;], &#34;Tuesday&#34;: [&#34;&#34;], &#34;Wednesday&#34;: [&#34;&#34;], &#34;Thursday&#34;: [&#34;&#34;], &#34;Friday&#34;: [&#34;&#34;], &#34;Saturday&#34;: [&#34;&#34;], &#34;January&#34;: [&#34;&#34;], &#34;February&#34;: [&#34;&#34;], &#34;March&#34;: [&#34;&#34;], &#34;April&#34;: [&#34;&#34;], &#34;May&#34;: [&#34;&#34;], &#34;June&#34;: [&#34;&#34;], &#34;July&#34;: [&#34;&#34;], &#34;August&#34;: [&#34;&#34;], &#34;September&#34;: [&#34;&#34;], &#34;October&#34;: [&#34;&#34;], &#34;November&#34;: [&#34;&#34;], &#34;December&#34;: [&#34;&#34;], &#34;SUN&#34;: [&#34;&#34;], &#34;MON&#34;: [&#34;&#34;], &#34;TUE&#34;: [&#34;&#34;], &#34;WED&#34;: [&#34;&#34;], &#34;THU&#34;: [&#34;&#34;], &#34;FRI&#34;: [&#34;&#34;], &#34;SAT&#34;: [&#34;&#34;], &#34;JAN&#34;: [&#34;&#34;], &#34;FEB&#34;: [&#34;&#34;], &#34;MAR&#34;: [&#34;&#34;], &#34;APR&#34;: [&#34;&#34;], &#34;MAY&#34;: [&#34;&#34;], &#34;JUN&#34;: [&#34;&#34;], &#34;JUL&#34;: [&#34;&#34;], &#34;AUG&#34;: [&#34;&#34;], &#34;SEP&#34;: [&#34;&#34;], &#34;OCT&#34;: [&#34;&#34;], &#34;NOV&#34;: [&#34;&#34;], &#34;DEC&#34;: [&#34;&#34;], &#34;OK&#34;: [&#34;&#34;], &#34;Click to see difference&#34;: [&#34;&#34;], &#34;Altered&#34;: [&#34;&#34;], &#34;Chart changes&#34;: [&#34;&#34;], &#34;Superset chart&#34;: [&#34;&#34;], &#34;Check out this chart in dashboard:&#34;: [&#34;&#34;], &#34;Select ...&#34;: [&#34;&#34;], &#34;Loaded data cached&#34;: [&#34;&#34;], &#34;Loaded from cache&#34;: [&#34;&#34;], &#34;Click to force-refresh&#34;: [&#34;&#34;], &#34;cached&#34;: [&#34;&#34;], &#34;Certified by %s&#34;: [&#34;&#34;], &#34;Copy to clipboard&#34;: [&#34;&#34;], &#34;Copied!&#34;: [&#34;&#34;], &#34;Sorry, your browser does not support copying. Use Ctrl / Cmd + C!&#34;: [&#34;&#34;], &#34;Error while fetching schema list&#34;: [&#34;&#34;], &#34;Error while fetching database list&#34;: [&#34;&#34;], &#34;Database:&#34;: [&#34;&#34;], &#34;Select a database&#34;: [&#34;&#34;], &#34;Force refresh schema list&#34;: [&#34;&#34;], &#34;Select a schema (%s)&#34;: [&#34;&#34;], &#34;Schema:&#34;: [&#34;&#34;], &#34;datasource&#34;: [&#34;&#34;], &#34;schema&#34;: [&#34;&#34;], &#34;delete&#34;: [&#34;&#34;], &#34;Type \&#34;%s\&#34; to confirm&#34;: [&#34;&#34;], &#34;DELETE&#34;: [&#34;&#34;], &#34;Click to edit&#34;: [&#34;&#34;], &#34;You don&#39;t have the rights to alter this title.&#34;: [&#34;&#34;], &#34;Unexpected error&#34;: [&#34;&#34;], &#34;Click to favorite/unfavorite&#34;: [&#34;&#34;], &#34;An error occurred while fetching dashboards&#34;: [&#34;&#34;], &#34;Error while fetching table list&#34;: [&#34;&#34;], &#34;Select table or type table name&#34;: [&#34;&#34;], &#34;Type to search ...&#34;: [&#34;&#34;], &#34;Select table &#34;: [&#34;&#34;], &#34;Force refresh table list&#34;: [&#34;&#34;], &#34;See table schema&#34;: [&#34;&#34;], &#34;%s%s&#34;: [&#34;&#34;], &#34;Share dashboard&#34;: [&#34;&#34;], &#34;This may be triggered by:&#34;: [&#34;&#34;], &#34;Please reach out to the Chart Owner for assistance.&#34;: [&#34;&#34;], &#34;Chart Owner: %s&#34;: [&#34;&#34;], &#34;%s Error&#34;: [&#34;&#34;], &#34;See more&#34;: [&#34;&#34;], &#34;See less&#34;: [&#34;&#34;], &#34;Copy message&#34;: [&#34;&#34;], &#34;Close&#34;: [&#34;&#34;], &#34;This was triggered by:&#34;: [&#34;&#34;], &#34;Did you mean:&#34;: [&#34;&#34;], &#34;%(suggestion)s instead of \&#34;%(undefinedParameter)s?\&#34;&#34;: [&#34;&#34;], &#34;Parameter error&#34;: [&#34;&#34;], &#34;We\u2019re having trouble loading this visualization. Queries are set to timeout after %s second.&#34;: [&#34;&#34;], &#34;We\u2019re having trouble loading these results. Queries are set to timeout after %s second.&#34;: [&#34;&#34;], &#34;Timeout error&#34;: [&#34;&#34;], &#34;Cell content&#34;: [&#34;&#34;], &#34;The import was successful&#34;: [&#34;&#34;], &#34;OVERWRITE&#34;: [&#34;&#34;], &#34;Overwrite&#34;: [&#34;&#34;], &#34;Import&#34;: [&#34;&#34;], &#34;Import %s&#34;: [&#34;&#34;], &#34;Last Updated %s&#34;: [&#34;&#34;], &#34;%s Selected&#34;: [&#34;&#34;], &#34;Deselect all&#34;: [&#34;&#34;], &#34;%s-%s of %s&#34;: [&#34;&#34;], &#34;Settings&#34;: [&#34;&#34;], &#34;About&#34;: [&#34;&#34;], &#34;SQL query&#34;: [&#34;&#34;], &#34;There is not enough space for this component. Try decreasing its width, or increasing the destination width.&#34;: [&#34;&#34;], &#34;Can not move top level tab into nested tabs&#34;: [&#34;&#34;], &#34;This chart has been moved to a different filter scope.&#34;: [&#34;&#34;], &#34;There was an issue fetching the favorite status of this dashboard.&#34;: [&#34;&#34;], &#34;There was an issue favoriting this dashboard.&#34;: [&#34;&#34;], &#34;This dashboard is now ${nowPublished}&#34;: [&#34;&#34;], &#34;You do not have permissions to edit this dashboard.&#34;: [&#34;&#34;], &#34;This dashboard was saved successfully.&#34;: [&#34;&#34;], &#34;Could not fetch all saved charts&#34;: [&#34;&#34;], &#34;Sorry there was an error fetching saved charts: &#34;: [&#34;&#34;], &#34;Visualization&#34;: [&#34;&#34;], &#34;Data source&#34;: [&#34;&#34;], &#34;Added&#34;: [&#34;&#34;], &#34;Components&#34;: [&#34;&#34;], &#34;Any color palette selected here will override the colors applied to this dashboard&#39;s individual charts&#34;: [&#34;&#34;], &#34;Color scheme&#34;: [&#34;&#34;], &#34;Load a template&#34;: [&#34;&#34;], &#34;Load a CSS template&#34;: [&#34;&#34;], &#34;Live CSS editor&#34;: [&#34;&#34;], &#34;You have unsaved changes.&#34;: [&#34;&#34;], &#34;This dashboard is currently force refreshing; the next force refresh will be in %s.&#34;: [&#34;&#34;], &#34;Your dashboard is too large. Please reduce the size before save it.&#34;: [&#34;&#34;], &#34;Discard changes&#34;: [&#34;&#34;], &#34;An error occurred while fetching available CSS templates&#34;: [&#34;&#34;], &#34;Superset dashboard&#34;: [&#34;&#34;], &#34;Check out this dashboard: &#34;: [&#34;&#34;], &#34;Refresh dashboard&#34;: [&#34;&#34;], &#34;Set auto-refresh interval&#34;: [&#34;&#34;], &#34;Set filter mapping&#34;: [&#34;&#34;], &#34;Edit dashboard properties&#34;: [&#34;&#34;], &#34;Edit CSS&#34;: [&#34;&#34;], &#34;Download as image&#34;: [&#34;&#34;], &#34;Toggle fullscreen&#34;: [&#34;&#34;], &#34;There is no chart definition associated with this component, could it have been deleted?&#34;: [&#34;&#34;], &#34;Delete this container and save to remove this message.&#34;: [&#34;&#34;], &#34;An error has occurred&#34;: [&#34;&#34;], &#34;You do not have permission to edit this dashboard&#34;: [&#34;&#34;], &#34;A valid color scheme is required&#34;: [&#34;&#34;], &#34;The dashboard has been saved&#34;: [&#34;&#34;], &#34;Apply&#34;: [&#34;&#34;], &#34;Dashboard properties&#34;: [&#34;&#34;], &#34;Basic information&#34;: [&#34;&#34;], &#34;URL slug&#34;: [&#34;&#34;], &#34;A readable URL for your dashboard&#34;: [&#34;&#34;], &#34;Access&#34;: [&#34;&#34;], &#34;Owners is a list of users who can alter the dashboard. Searchable by name or username.&#34;: [&#34;&#34;], &#34;Colors&#34;: [&#34;&#34;], &#34;Advanced&#34;: [&#34;&#34;], &#34;JSON metadata&#34;: [&#34;&#34;], &#34;This dashboard is not published, it will not show up in the list of dashboards. Click here to publish this dashboard.&#34;: [&#34;&#34;], &#34;This dashboard is not published which means it will not show up in the list of dashboards. Favorite it to see it there or access it by using the URL directly.&#34;: [&#34;&#34;], &#34;This dashboard is published. Click to make it a draft.&#34;: [&#34;&#34;], &#34;Draft&#34;: [&#34;&#34;], &#34;Don&#39;t refresh&#34;: [&#34;&#34;], &#34;10 seconds&#34;: [&#34;&#34;], &#34;30 seconds&#34;: [&#34;&#34;], &#34;1 minute&#34;: [&#34;&#34;], &#34;5 minutes&#34;: [&#34;&#34;], &#34;30 minutes&#34;: [&#34;&#34;], &#34;1 hour&#34;: [&#34;&#34;], &#34;6 hours&#34;: [&#34;&#34;], &#34;12 hours&#34;: [&#34;&#34;], &#34;24 hours&#34;: [&#34;&#34;], &#34;Refresh interval&#34;: [&#34;&#34;], &#34;Refresh frequency&#34;: [&#34;&#34;], &#34;Are you sure you want to proceed?&#34;: [&#34;&#34;], &#34;Save for this session&#34;: [&#34;&#34;], &#34;You must pick a name for the new dashboard&#34;: [&#34;&#34;], &#34;Save dashboard&#34;: [&#34;&#34;], &#34;Overwrite Dashboard [%s]&#34;: [&#34;&#34;], &#34;Save as:&#34;: [&#34;&#34;], &#34;[dashboard name]&#34;: [&#34;&#34;], &#34;also copy (duplicate) charts&#34;: [&#34;&#34;], &#34;Filter your charts&#34;: [&#34;&#34;], &#34;Annotation layers are still loading.&#34;: [&#34;&#34;], &#34;One ore more annotation layers failed loading.&#34;: [&#34;&#34;], &#34;Cached %s&#34;: [&#34;&#34;], &#34;Fetched %s&#34;: [&#34;&#34;], &#34;Minimize chart&#34;: [&#34;&#34;], &#34;Maximize chart&#34;: [&#34;&#34;], &#34;Force refresh&#34;: [&#34;&#34;], &#34;Toggle chart description&#34;: [&#34;&#34;], &#34;View chart in Explore&#34;: [&#34;&#34;], &#34;Share chart&#34;: [&#34;&#34;], &#34;Export CSV&#34;: [&#34;&#34;], &#34;Applied Filters (%d)&#34;: [&#34;&#34;], &#34;Incompatible Filters (%d)&#34;: [&#34;&#34;], &#34;Unset Filters (%d)&#34;: [&#34;&#34;], &#34;Search...&#34;: [&#34;&#34;], &#34;No filter is selected.&#34;: [&#34;&#34;], &#34;Editing 1 filter:&#34;: [&#34;&#34;], &#34;Batch editing %d filters:&#34;: [&#34;&#34;], &#34;Configure filter scopes&#34;: [&#34;&#34;], &#34;There are no filters in this dashboard.&#34;: [&#34;&#34;], &#34;Expand all&#34;: [&#34;&#34;], &#34;Collapse all&#34;: [&#34;&#34;], &#34;This markdown component has an error.&#34;: [&#34;&#34;], &#34;This markdown component has an error. Please revert your recent changes.&#34;: [&#34;&#34;], &#34;Delete dashboard tab?&#34;: [&#34;&#34;], &#34;Divider&#34;: [&#34;&#34;], &#34;Header&#34;: [&#34;&#34;], &#34;Row&#34;: [&#34;&#34;], &#34;Tabs&#34;: [&#34;&#34;], &#34;Preview&#34;: [&#34;&#34;], &#34;Yes, cancel&#34;: [&#34;&#34;], &#34;Keep editing&#34;: [&#34;&#34;], &#34;Select parent filters&#34;: [&#34;&#34;], &#34;Reset all&#34;: [&#34;&#34;], &#34;You have removed this filter.&#34;: [&#34;&#34;], &#34;Restore filter&#34;: [&#34;&#34;], &#34;Filter name&#34;: [&#34;&#34;], &#34;Name is required&#34;: [&#34;&#34;], &#34;Datasource is required&#34;: [&#34;&#34;], &#34;Field&#34;: [&#34;&#34;], &#34;Parent filter&#34;: [&#34;&#34;], &#34;None&#34;: [&#34;&#34;], &#34;Apply changes instantly&#34;: [&#34;&#34;], &#34;Allow multiple selections&#34;: [&#34;&#34;], &#34;Inverse selection&#34;: [&#34;&#34;], &#34;Required&#34;: [&#34;&#34;], &#34;Are you sure you want to cancel?&#34;: [&#34;&#34;], &#34;will not be saved.&#34;: [&#34;&#34;], &#34;Filter configuration and scoping&#34;: [&#34;&#34;], &#34;Add filter&#34;: [&#34;&#34;], &#34;(Removed)&#34;: [&#34;&#34;], &#34;Undo?&#34;: [&#34;&#34;], &#34;Scoping&#34;: [&#34;&#34;], &#34;Apply to all panels&#34;: [&#34;&#34;], &#34;Apply to specific panels&#34;: [&#34;&#34;], &#34;Only selected panels will be affected by this filter&#34;: [&#34;&#34;], &#34;All panels with this column will be affected by this filter&#34;: [&#34;&#34;], &#34;All filters&#34;: [&#34;&#34;], &#34;All charts&#34;: [&#34;&#34;], &#34;Warning! Changing the dataset may break the chart if the metadata does not exist.&#34;: [&#34;&#34;], &#34;Changing the dataset may break the chart if the chart relies on columns or metadata that does not exist in the target dataset&#34;: [&#34;&#34;], &#34;dataset&#34;: [&#34;&#34;], &#34;Change dataset&#34;: [&#34;&#34;], &#34;Warning!&#34;: [&#34;&#34;], &#34;Search / Filter&#34;: [&#34;&#34;], &#34;Physical (table or view)&#34;: [&#34;&#34;], &#34;Virtual (SQL)&#34;: [&#34;&#34;], &#34;SQL expression&#34;: [&#34;&#34;], &#34;Data type&#34;: [&#34;&#34;], &#34;Datetime format&#34;: [&#34;&#34;], &#34;The pattern of timestamp format. For strings use &#34;: [&#34;&#34;], &#34;Python datetime string pattern&#34;: [&#34;&#34;], &#34; expression which needs to adhere to the &#34;: [&#34;&#34;], &#34;ISO 8601&#34;: [&#34;&#34;], &#34; standard to ensure that the lexicographical ordering\n                      coincides with the chronological ordering. If the\n                      timestamp format does not adhere to the ISO 8601 standard\n                      you will need to define an expression and type for\n                      transforming the string into a date or timestamp. Note\n                      currently time zones are not supported. If time is stored\n                      in epoch format, put `epoch_s` or `epoch_ms`. If no pattern\n                      is specified we fall back to using the optional defaults on a per\n                      database/column name level via the extra parameter.&#34;: [&#34;&#34;], &#34;Is dimension&#34;: [&#34;&#34;], &#34;Is filterable&#34;: [&#34;&#34;], &#34;Modified columns: %s&#34;: [&#34;&#34;], &#34;Removed columns: %s&#34;: [&#34;&#34;], &#34;New columns added: %s&#34;: [&#34;&#34;], &#34;Metadata has been synced&#34;: [&#34;&#34;], &#34;Column name [%s] is duplicated&#34;: [&#34;&#34;], &#34;Metric name [%s] is duplicated&#34;: [&#34;&#34;], &#34;Calculated column [%s] requires an expression&#34;: [&#34;&#34;], &#34;Basic&#34;: [&#34;&#34;], &#34;Default URL&#34;: [&#34;&#34;], &#34;Default URL to redirect to when accessing from the dataset list page&#34;: [&#34;&#34;], &#34;Autocomplete filters&#34;: [&#34;&#34;], &#34;Whether to populate autocomplete filters options&#34;: [&#34;&#34;], &#34;Autocomplete query predicate&#34;: [&#34;&#34;], &#34;When using \&#34;Autocomplete filters\&#34;, this can be used to improve performance of the query fetching the values. Use this option to apply a predicate (WHERE clause) to the query selecting the distinct values from the table. Typically the intent would be to limit the scan by applying a relative time filter on a partitioned or indexed time-related field.&#34;: [&#34;&#34;], &#34;Extra data to specify table metadata. Currently supports certification data of the format: `{ \&#34;certification\&#34;: { \&#34;certified_by\&#34;: \&#34;Data Platform Team\&#34;, \&#34;details\&#34;: \&#34;This table is the source of truth.\&#34; } }`.&#34;: [&#34;&#34;], &#34;Owners of the dataset&#34;: [&#34;&#34;], &#34;Cache timeout&#34;: [&#34;&#34;], &#34;The duration of time in seconds before the cache is invalidated&#34;: [&#34;&#34;], &#34;Hours offset&#34;: [&#34;&#34;], &#34;Spatial&#34;: [&#34;&#34;], &#34;virtual&#34;: [&#34;&#34;], &#34;Dataset name&#34;: [&#34;&#34;], &#34;When specifying SQL, the datasource acts as a view. Superset will use this statement as a subquery while grouping and filtering on the generated parent queries.&#34;: [&#34;&#34;], &#34;The JSON metric or post aggregation definition.&#34;: [&#34;&#34;], &#34;Physical&#34;: [&#34;&#34;], &#34;The pointer to a physical table (or view). Keep in mind that the chart is associated to this Superset logical table, and this logical table points the physical table referenced here.&#34;: [&#34;&#34;], &#34;Click the lock to make changes.&#34;: [&#34;&#34;], &#34;Click the lock to prevent further changes.&#34;: [&#34;&#34;], &#34;D3 format&#34;: [&#34;&#34;], &#34;Warning message&#34;: [&#34;&#34;], &#34;Warning message to display in the metric selector&#34;: [&#34;&#34;], &#34;Certified by&#34;: [&#34;&#34;], &#34;Person or group that has certified this metric&#34;: [&#34;&#34;], &#34;Certification details&#34;: [&#34;&#34;], &#34;Details of the certification&#34;: [&#34;&#34;], &#34;Be careful.&#34;: [&#34;&#34;], &#34;Changing these settings will affect all charts using this dataset, including charts owned by other people.&#34;: [&#34;&#34;], &#34;Source&#34;: [&#34;&#34;], &#34;Sync columns from source&#34;: [&#34;&#34;], &#34;Calculated columns&#34;: [&#34;&#34;], &#34;The dataset has been saved&#34;: [&#34;&#34;], &#34;The dataset configuration exposed here\n                affects all the charts using this dataset.\n                Be mindful that changing settings\n                here may affect other charts\n                in undesirable ways.&#34;: [&#34;&#34;], &#34;Are you sure you want to save and apply changes?&#34;: [&#34;&#34;], &#34;Confirm save&#34;: [&#34;&#34;], &#34;Edit Dataset &#34;: [&#34;&#34;], &#34;Use legacy datasource editor&#34;: [&#34;&#34;], &#34;Time range&#34;: [&#34;&#34;], &#34;Time column&#34;: [&#34;&#34;], &#34;Time grain&#34;: [&#34;&#34;], &#34;Origin&#34;: [&#34;&#34;], &#34;Time granularity&#34;: [&#34;&#34;], &#34;A reference to the [Time] configuration, taking granularity into account&#34;: [&#34;&#34;], &#34;Group by&#34;: [&#34;&#34;], &#34;One or many controls to group by&#34;: [&#34;&#34;], &#34;One or many metrics to display&#34;: [&#34;&#34;], &#34;Dataset&#34;: [&#34;&#34;], &#34;Visualization type&#34;: [&#34;&#34;], &#34;The type of visualization to display&#34;: [&#34;&#34;], &#34;Fixed color&#34;: [&#34;&#34;], &#34;Use this to define a static color for all circles&#34;: [&#34;&#34;], &#34;Right axis metric&#34;: [&#34;&#34;], &#34;Choose a metric for right axis&#34;: [&#34;&#34;], &#34;Linear color scheme&#34;: [&#34;&#34;], &#34;Color metric&#34;: [&#34;&#34;], &#34;A metric to use for color&#34;: [&#34;&#34;], &#34;One or many controls to pivot as columns&#34;: [&#34;&#34;], &#34;Defines the origin where time buckets start, accepts natural dates as in `now`, `sunday` or `1970-01-01`&#34;: [&#34;&#34;], &#34;The time granularity for the visualization. Note that you can type and use simple natural language as in `10 seconds`, `1 day` or `56 weeks`&#34;: [&#34;&#34;], &#34;The time column for the visualization. Note that you can define arbitrary expression that return a DATETIME column in the table. Also note that the filter below is applied against this column or expression&#34;: [&#34;&#34;], &#34;The time granularity for the visualization. This applies a date transformation to alter your time column and defines a new time granularity. The options here are defined on a per database engine basis in the Superset source code.&#34;: [&#34;&#34;], &#34;Last week&#34;: [&#34;&#34;], &#34;The time range for the visualization. All relative times, e.g. \&#34;Last month\&#34;, \&#34;Last 7 days\&#34;, \&#34;now\&#34;, etc. are evaluated on the server using the server&#39;s local time (sans timezone). All tooltips and placeholder times are expressed in UTC (sans timezone). The timestamps are then evaluated by the database using the engine&#39;s local timezone. Note one can explicitly set the timezone per the ISO 8601 format if specifying either the start and/or end time.&#34;: [&#34;&#34;], &#34;Row limit&#34;: [&#34;&#34;], &#34;Series limit&#34;: [&#34;&#34;], &#34;Limits the number of time series that get displayed. A sub query (or an extra phase where sub queries are not supported) is applied to limit the number of time series that get fetched and displayed. This feature is useful when grouping by high cardinality dimension(s).&#34;: [&#34;&#34;], &#34;Sort by&#34;: [&#34;&#34;], &#34;Metric used to define the top series&#34;: [&#34;&#34;], &#34;Series&#34;: [&#34;&#34;], &#34;Defines the grouping of entities. Each series is shown as a specific color on the chart and has a legend toggle&#34;: [&#34;&#34;], &#34;Entity&#34;: [&#34;&#34;], &#34;This defines the element to be plotted on the chart&#34;: [&#34;&#34;], &#34;X Axis&#34;: [&#34;&#34;], &#34;Metric assigned to the [X] axis&#34;: [&#34;&#34;], &#34;Y Axis&#34;: [&#34;&#34;], &#34;Metric assigned to the [Y] axis&#34;: [&#34;&#34;], &#34;Bubble size&#34;: [&#34;&#34;], &#34;Y Axis Format&#34;: [&#34;&#34;], &#34;When `Calculation type` is set to \&#34;Percentage change\&#34;, the Y Axis Format is forced to `.1%`&#34;: [&#34;&#34;], &#34;The color scheme for rendering chart&#34;: [&#34;&#34;], &#34;Color map&#34;: [&#34;&#34;], &#34;description&#34;: [&#34;&#34;], &#34;bolt&#34;: [&#34;&#34;], &#34;Changing this control takes effect instantly&#34;: [&#34;&#34;], &#34;Customize&#34;: [&#34;&#34;], &#34;rows retrieved&#34;: [&#34;&#34;], &#34;Sorry, An error occurred&#34;: [&#34;&#34;], &#34;No data&#34;: [&#34;&#34;], &#34;View samples&#34;: [&#34;&#34;], &#34;Search Metrics &amp; Columns&#34;: [&#34;&#34;], &#34;Showing %s of %s&#34;: [&#34;&#34;], &#34;New chart&#34;: [&#34;&#34;], &#34;Edit properties&#34;: [&#34;&#34;], &#34;View query&#34;: [&#34;&#34;], &#34;Run in SQL Lab&#34;: [&#34;&#34;], &#34;Height&#34;: [&#34;&#34;], &#34;Width&#34;: [&#34;&#34;], &#34;Export to .json&#34;: [&#34;&#34;], &#34;Export to .csv format&#34;: [&#34;&#34;], &#34;%s - untitled&#34;: [&#34;&#34;], &#34;Edit chart properties&#34;: [&#34;&#34;], &#34;Control labeled &#34;: [&#34;&#34;], &#34;Open Datasource tab&#34;: [&#34;&#34;], &#34;You do not have permission to edit this chart&#34;: [&#34;&#34;], &#34;The description can be displayed as widget headers in the dashboard view. Supports markdown.&#34;: [&#34;&#34;], &#34;Configuration&#34;: [&#34;&#34;], &#34;Duration (in seconds) of the caching timeout for this chart. Note this defaults to the dataset&#39;s timeout if undefined.&#34;: [&#34;&#34;], &#34;A list of users who can alter the chart. Searchable by name or username.&#34;: [&#34;&#34;], &#34;rows&#34;: [&#34;&#34;], &#34;Limit reached&#34;: [&#34;&#34;], &#34;**Select** a dashboard OR **create** a new one&#34;: [&#34;&#34;], &#34;Please enter a chart name&#34;: [&#34;&#34;], &#34;Save chart&#34;: [&#34;&#34;], &#34;Save &amp; go to dashboard&#34;: [&#34;&#34;], &#34;Save as new chart&#34;: [&#34;&#34;], &#34;Save (Overwrite)&#34;: [&#34;&#34;], &#34;Save as ...&#34;: [&#34;&#34;], &#34;Chart name&#34;: [&#34;&#34;], &#34;Add to dashboard&#34;: [&#34;&#34;], &#34;Display configuration&#34;: [&#34;&#34;], &#34;Configure your how you overlay is displayed here.&#34;: [&#34;&#34;], &#34;Style&#34;: [&#34;&#34;], &#34;Opacity&#34;: [&#34;&#34;], &#34;Color&#34;: [&#34;&#34;], &#34;Line width&#34;: [&#34;&#34;], &#34;Layer configuration&#34;: [&#34;&#34;], &#34;Configure the basics of your Annotation Layer.&#34;: [&#34;&#34;], &#34;Mandatory&#34;: [&#34;&#34;], &#34;Hide layer&#34;: [&#34;&#34;], &#34;Choose the annotation layer type&#34;: [&#34;&#34;], &#34;Annotation layer type&#34;: [&#34;&#34;], &#34;Remove&#34;: [&#34;&#34;], &#34;Edit annotation layer&#34;: [&#34;&#34;], &#34;Add annotation layer&#34;: [&#34;&#34;], &#34;`Min` value should be numeric or empty&#34;: [&#34;&#34;], &#34;`Max` value should be numeric or empty&#34;: [&#34;&#34;], &#34;Min&#34;: [&#34;&#34;], &#34;Max&#34;: [&#34;&#34;], &#34;Edit dataset&#34;: [&#34;&#34;], &#34;View in SQL Lab&#34;: [&#34;&#34;], &#34;More dataset related options&#34;: [&#34;&#34;], &#34;Superset supports smart date parsing. Strings like `3 weeks ago`, `last sunday`, or `2 weeks from now` can be used.&#34;: [&#34;&#34;], &#34;Default&#34;: [&#34;&#34;], &#34;(optional) default value for the filter, when using the multiple option, you can use a semicolon-delimited list of options.&#34;: [&#34;&#34;], &#34;Sort metric&#34;: [&#34;&#34;], &#34;Metric to sort the results by&#34;: [&#34;&#34;], &#34;Sort ascending&#34;: [&#34;&#34;], &#34;Check for sorting ascending&#34;: [&#34;&#34;], &#34;Multiple selections allowed, otherwise filter is limited to a single value&#34;: [&#34;&#34;], &#34;Search all filter options&#34;: [&#34;&#34;], &#34;By default, each filter loads at most 1000 choices at the initial page load. Check this box if you have more than 1000 filter values and want to enable dynamically searching that loads filter values as users type (may add stress to your database).&#34;: [&#34;&#34;], &#34;User must select a value for this filter&#34;: [&#34;&#34;], &#34;Filter configuration&#34;: [&#34;&#34;], &#34;Error while fetching data&#34;: [&#34;&#34;], &#34;No results found&#34;: [&#34;&#34;], &#34;%s option(s)&#34;: [&#34;&#34;], &#34;Invalid lat/long configuration.&#34;: [&#34;&#34;], &#34;Reverse lat/long &#34;: [&#34;&#34;], &#34;Longitude &amp; Latitude columns&#34;: [&#34;&#34;], &#34;Delimited long &amp; lat single column&#34;: [&#34;&#34;], &#34;Multiple formats accepted, look the geopy.points Python library for more details&#34;: [&#34;&#34;], &#34;Geohash&#34;: [&#34;&#34;], &#34;textarea&#34;: [&#34;&#34;], &#34;in modal&#34;: [&#34;&#34;], &#34;Time series columns&#34;: [&#34;&#34;], &#34;This visualization type is not supported.&#34;: [&#34;&#34;], &#34;Click to change visualization type&#34;: [&#34;&#34;], &#34;Select a visualization type&#34;: [&#34;&#34;], &#34;Failed to verify select options: %s&#34;: [&#34;&#34;], &#34;RANGE TYPE&#34;: [&#34;&#34;], &#34;Actual time range&#34;: [&#34;&#34;], &#34;CANCEL&#34;: [&#34;&#34;], &#34;APPLY&#34;: [&#34;&#34;], &#34;Edit time range&#34;: [&#34;&#34;], &#34;Configure advanced time range&#34;: [&#34;&#34;], &#34;START&#34;: [&#34;&#34;], &#34;END&#34;: [&#34;&#34;], &#34;Configure Time Range: Previous...&#34;: [&#34;&#34;], &#34;Configure Time Range: Last...&#34;: [&#34;&#34;], &#34;Configure custom time range&#34;: [&#34;&#34;], &#34;Relative quantity&#34;: [&#34;&#34;], &#34;Anchor to&#34;: [&#34;&#34;], &#34;NOW&#34;: [&#34;&#34;], &#34;Date/Time&#34;: [&#34;&#34;], &#34;Simple&#34;: [&#34;&#34;], &#34;Custom SQL&#34;: [&#34;&#34;], &#34;No such column found. To filter on a metric, try the Custom SQL tab.&#34;: [&#34;&#34;], &#34;%s column(s) and metric(s)&#34;: [&#34;&#34;], &#34;%s column(s)&#34;: [&#34;&#34;], &#34;To filter on a metric, use Custom SQL tab.&#34;: [&#34;&#34;], &#34;%s operator(s)&#34;: [&#34;&#34;], &#34;Type a value here&#34;: [&#34;&#34;], &#34;Filter value (case sensitive)&#34;: [&#34;&#34;], &#34;choose WHERE or HAVING...&#34;: [&#34;&#34;], &#34;Filters by columns&#34;: [&#34;&#34;], &#34;Filters by metrics&#34;: [&#34;&#34;], &#34;\n                This filter was inherited from the dashboard&#39;s context.\n                It won&#39;t be saved when saving the chart.\n              &#34;: [&#34;&#34;], &#34;%s aggregates(s)&#34;: [&#34;&#34;], &#34;%s saved metric(s)&#34;: [&#34;&#34;], &#34;Saved&#34;: [&#34;&#34;], &#34;Saved metric&#34;: [&#34;&#34;], &#34;column&#34;: [&#34;&#34;], &#34;aggregate&#34;: [&#34;&#34;], &#34;My metric&#34;: [&#34;&#34;], &#34;Add metric&#34;: [&#34;&#34;], &#34;Code&#34;: [&#34;&#34;], &#34;Markup type&#34;: [&#34;&#34;], &#34;Pick your favorite markup language&#34;: [&#34;&#34;], &#34;Put your code here&#34;: [&#34;&#34;], &#34;Query&#34;: [&#34;&#34;], &#34;URL&#34;: [&#34;&#34;], &#34;Templated link, it&#39;s possible to include {{ metric }} or other values coming from the controls.&#34;: [&#34;&#34;], &#34;Time&#34;: [&#34;&#34;], &#34;Time related form attributes&#34;: [&#34;&#34;], &#34;Chart type&#34;: [&#34;&#34;], &#34;Chart ID&#34;: [&#34;&#34;], &#34;The id of the active chart&#34;: [&#34;&#34;], &#34;Cache Timeout (seconds)&#34;: [&#34;&#34;], &#34;The number of seconds before expiring the cache&#34;: [&#34;&#34;], &#34;URL parameters&#34;: [&#34;&#34;], &#34;Extra parameters for use in jinja templated queries&#34;: [&#34;&#34;], &#34;Time range endpoints&#34;: [&#34;&#34;], &#34;Time range endpoints (SIP-15)&#34;: [&#34;&#34;], &#34;Annotations and layers&#34;: [&#34;&#34;], &#34;Sort descending&#34;: [&#34;&#34;], &#34;Whether to sort descending or ascending&#34;: [&#34;&#34;], &#34;Contribution&#34;: [&#34;&#34;], &#34;Compute the contribution to the total&#34;: [&#34;&#34;], &#34;Advanced analytics&#34;: [&#34;&#34;], &#34;This section contains options that allow for advanced analytical post processing of query results&#34;: [&#34;&#34;], &#34;Rolling window&#34;: [&#34;&#34;], &#34;Rolling function&#34;: [&#34;&#34;], &#34;Defines a rolling window function to apply, works along with the [Periods] text box&#34;: [&#34;&#34;], &#34;Periods&#34;: [&#34;&#34;], &#34;Defines the size of the rolling window function, relative to the time granularity selected&#34;: [&#34;&#34;], &#34;Min periods&#34;: [&#34;&#34;], &#34;The minimum number of rolling periods required to show a value. For instance if you do a cumulative sum on 7 days you may want your \&#34;Min Period\&#34; to be 7, so that all data points shown are the total of 7 periods. This will hide the \&#34;ramp up\&#34; taking place over the first 7 periods&#34;: [&#34;&#34;], &#34;Time comparison&#34;: [&#34;&#34;], &#34;Time shift&#34;: [&#34;&#34;], &#34;Overlay one or more timeseries from a relative time period. Expects relative time deltas in natural language (example:  24 hours, 7 days, 52 weeks, 365 days). Free text is supported.&#34;: [&#34;&#34;], &#34;Calculation type&#34;: [&#34;&#34;], &#34;How to display time shifts: as individual lines; as the absolute difference between the main time series and each time shift; as the percentage change; or as the ratio between series and time shifts.&#34;: [&#34;&#34;], &#34;Python functions&#34;: [&#34;&#34;], &#34;Rule&#34;: [&#34;&#34;], &#34;Pandas resample rule&#34;: [&#34;&#34;], &#34;Method&#34;: [&#34;&#34;], &#34;Pandas resample method&#34;: [&#34;&#34;], &#34;Favorites&#34;: [&#34;&#34;], &#34;Created content&#34;: [&#34;&#34;], &#34;Recent activity&#34;: [&#34;&#34;], &#34;Security &amp; Access&#34;: [&#34;&#34;], &#34;No charts&#34;: [&#34;&#34;], &#34;No dashboards&#34;: [&#34;&#34;], &#34;No favorite charts yet, go click on stars!&#34;: [&#34;&#34;], &#34;No favorite dashboards yet, go click on stars!&#34;: [&#34;&#34;], &#34;Profile picture provided by Gravatar&#34;: [&#34;&#34;], &#34;joined&#34;: [&#34;&#34;], &#34;id:&#34;: [&#34;&#34;], &#34;There was an error fetching your recent activity:&#34;: [&#34;&#34;], &#34;Deleted: %s&#34;: [&#34;&#34;], &#34;There was an issue deleting: %s&#34;: [&#34;&#34;], &#34;There was an issue deleting %s: %s&#34;: [&#34;&#34;], &#34;report&#34;: [&#34;&#34;], &#34;alert&#34;: [&#34;&#34;], &#34;reports&#34;: [&#34;&#34;], &#34;alerts&#34;: [&#34;&#34;], &#34;There was an issue deleting the selected %s: %s&#34;: [&#34;&#34;], &#34;Last run&#34;: [&#34;&#34;], &#34;Notification method&#34;: [&#34;&#34;], &#34;Execution log&#34;: [&#34;&#34;], &#34;Actions&#34;: [&#34;&#34;], &#34;Bulk select&#34;: [&#34;&#34;], &#34;No %s yet&#34;: [&#34;&#34;], &#34;Created by&#34;: [&#34;&#34;], &#34;An error occurred while fetching created by values: %s&#34;: [&#34;&#34;], &#34;Status&#34;: [&#34;&#34;], &#34;${AlertState.success}&#34;: [&#34;&#34;], &#34;${AlertState.working}&#34;: [&#34;&#34;], &#34;${AlertState.error}&#34;: [&#34;&#34;], &#34;${AlertState.noop}&#34;: [&#34;&#34;], &#34;${AlertState.grace}&#34;: [&#34;&#34;], &#34;Alerts &amp; reports&#34;: [&#34;&#34;], &#34;Reports&#34;: [&#34;&#34;], &#34;This action will permanently delete %s.&#34;: [&#34;&#34;], &#34;Delete %s?&#34;: [&#34;&#34;], &#34;Please confirm&#34;: [&#34;&#34;], &#34;Are you sure you want to delete the selected %s?&#34;: [&#34;&#34;], &#34;&lt; (Smaller than)&#34;: [&#34;&#34;], &#34;&gt; (Larger than)&#34;: [&#34;&#34;], &#34;&lt;= (Smaller or equal)&#34;: [&#34;&#34;], &#34;&gt;= (Larger or equal)&#34;: [&#34;&#34;], &#34;== (Is equal)&#34;: [&#34;&#34;], &#34;!= (Is not equal)&#34;: [&#34;&#34;], &#34;Not null&#34;: [&#34;&#34;], &#34;30 days&#34;: [&#34;&#34;], &#34;60 days&#34;: [&#34;&#34;], &#34;90 days&#34;: [&#34;&#34;], &#34;Add notification method&#34;: [&#34;&#34;], &#34;Add delivery method&#34;: [&#34;&#34;], &#34;Recipients are separated by \&#34;,\&#34; or \&#34;;\&#34;&#34;: [&#34;&#34;], &#34;Add&#34;: [&#34;&#34;], &#34;Edit ${isReport ? &#39;Report&#39; : &#39;Alert&#39;}&#34;: [&#34;&#34;], &#34;Add ${isReport ? &#39;Report&#39; : &#39;Alert&#39;}&#34;: [&#34;&#34;], &#34;Report name&#34;: [&#34;&#34;], &#34;Alert name&#34;: [&#34;&#34;], &#34;Alert condition&#34;: [&#34;&#34;], &#34;Trigger Alert If...&#34;: [&#34;&#34;], &#34;Value&#34;: [&#34;&#34;], &#34;Report schedule&#34;: [&#34;&#34;], &#34;Alert condition schedule&#34;: [&#34;&#34;], &#34;Schedule settings&#34;: [&#34;&#34;], &#34;Log retention&#34;: [&#34;&#34;], &#34;Working timeout&#34;: [&#34;&#34;], &#34;Time in seconds&#34;: [&#34;&#34;], &#34;Grace period&#34;: [&#34;&#34;], &#34;Message content&#34;: [&#34;&#34;], &#34;log&#34;: [&#34;&#34;], &#34;State&#34;: [&#34;&#34;], &#34;Scheduled at&#34;: [&#34;&#34;], &#34;Start at&#34;: [&#34;&#34;], &#34;Duration&#34;: [&#34;&#34;], &#34;Error message&#34;: [&#34;&#34;], &#34;${alertResource?.type}&#34;: [&#34;&#34;], &#34;CRON expression&#34;: [&#34;&#34;], &#34;Report sent&#34;: [&#34;&#34;], &#34;Alert triggered, notification sent&#34;: [&#34;&#34;], &#34;Report sending&#34;: [&#34;&#34;], &#34;Alert running&#34;: [&#34;&#34;], &#34;Report failed&#34;: [&#34;&#34;], &#34;Alert failed&#34;: [&#34;&#34;], &#34;Nothing triggered&#34;: [&#34;&#34;], &#34;Alert Triggered, In Grace Period&#34;: [&#34;&#34;], &#34;${RecipientIconName.email}&#34;: [&#34;&#34;], &#34;${RecipientIconName.slack}&#34;: [&#34;&#34;], &#34;annotation&#34;: [&#34;&#34;], &#34;There was an issue deleting the selected annotations: %s&#34;: [&#34;&#34;], &#34;Edit annotation&#34;: [&#34;&#34;], &#34;Delete annotation&#34;: [&#34;&#34;], &#34;Annotation&#34;: [&#34;&#34;], &#34;No annotation yet&#34;: [&#34;&#34;], &#34;Annotation Layer ${annotationLayerName}&#34;: [&#34;&#34;], &#34;Are you sure you want to delete ${annotationCurrentlyDeleting?.short_descr}?&#34;: [&#34;&#34;], &#34;Delete Annotation?&#34;: [&#34;&#34;], &#34;Are you sure you want to delete the selected annotations?&#34;: [&#34;&#34;], &#34;Add annotation&#34;: [&#34;&#34;], &#34;Annotation name&#34;: [&#34;&#34;], &#34;date&#34;: [&#34;&#34;], &#34;Additional information&#34;: [&#34;&#34;], &#34;Description (this can be seen in the list)&#34;: [&#34;&#34;], &#34;annotation_layer&#34;: [&#34;&#34;], &#34;Edit annotation layer properties&#34;: [&#34;&#34;], &#34;Annotation layer name&#34;: [&#34;&#34;], &#34;Annotation layers&#34;: [&#34;&#34;], &#34;There was an issue deleting the selected layers: %s&#34;: [&#34;&#34;], &#34;Last modified&#34;: [&#34;&#34;], &#34;Created on&#34;: [&#34;&#34;], &#34;Edit template&#34;: [&#34;&#34;], &#34;Delete template&#34;: [&#34;&#34;], &#34;Annotation layer&#34;: [&#34;&#34;], &#34;An error occurred while fetching dataset datasource values: %s&#34;: [&#34;&#34;], &#34;No annotation layers yet&#34;: [&#34;&#34;], &#34;This action will permanently delete the layer.&#34;: [&#34;&#34;], &#34;Delete Layer?&#34;: [&#34;&#34;], &#34;Are you sure you want to delete the selected layers?&#34;: [&#34;&#34;], &#34;Are you sure you want to delete&#34;: [&#34;&#34;], &#34;Last modified %s&#34;: [&#34;&#34;], &#34;The passwords for the databases below are needed in order to import them together with the charts. Please note that the \&#34;Secure Extra\&#34; and \&#34;Certificate\&#34; sections of the database configuration are not present in export files, and should be added manually after the import if they are needed.&#34;: [&#34;&#34;], &#34;You are importing one or more charts that already exist. Overwriting might cause you to lose some of your work. Are you sure you want to overwrite?&#34;: [&#34;&#34;], &#34;There was an issue deleting the selected charts: %s&#34;: [&#34;&#34;], &#34;Modified by&#34;: [&#34;&#34;], &#34;Owner&#34;: [&#34;&#34;], &#34;An error occurred while fetching chart owners values: %s&#34;: [&#34;&#34;], &#34;An error occurred while fetching chart created by values: %s&#34;: [&#34;&#34;], &#34;Viz type&#34;: [&#34;&#34;], &#34;An error occurred while fetching chart dataset values: %s&#34;: [&#34;&#34;], &#34;Favorite&#34;: [&#34;&#34;], &#34;Yes&#34;: [&#34;&#34;], &#34;No&#34;: [&#34;&#34;], &#34;Are you sure you want to delete the selected charts?&#34;: [&#34;&#34;], &#34;css_template&#34;: [&#34;&#34;], &#34;Edit CSS template properties&#34;: [&#34;&#34;], &#34;Add CSS template&#34;: [&#34;&#34;], &#34;CSS template name&#34;: [&#34;&#34;], &#34;css&#34;: [&#34;&#34;], &#34;CSS templates&#34;: [&#34;&#34;], &#34;There was an issue deleting the selected templates: %s&#34;: [&#34;&#34;], &#34;Last modified by %s&#34;: [&#34;&#34;], &#34;CSS template&#34;: [&#34;&#34;], &#34;This action will permanently delete the template.&#34;: [&#34;&#34;], &#34;Delete Template?&#34;: [&#34;&#34;], &#34;Are you sure you want to delete the selected templates?&#34;: [&#34;&#34;], &#34;The passwords for the databases below are needed in order to import them together with the dashboards. Please note that the \&#34;Secure Extra\&#34; and \&#34;Certificate\&#34; sections of the database configuration are not present in export files, and should be added manually after the import if they are needed.&#34;: [&#34;&#34;], &#34;You are importing one or more dashboards that already exist. Overwriting might cause you to lose some of your work. Are you sure you want to overwrite?&#34;: [&#34;&#34;], &#34;An error occurred while fetching dashboards: %s&#34;: [&#34;&#34;], &#34;There was an issue deleting the selected dashboards: &#34;: [&#34;&#34;], &#34;An error occurred while fetching dashboard owner values: %s&#34;: [&#34;&#34;], &#34;An error occurred while fetching dashboard created by values: %s&#34;: [&#34;&#34;], &#34;Unpublished&#34;: [&#34;&#34;], &#34;Are you sure you want to delete the selected dashboards?&#34;: [&#34;&#34;], &#34;Sorry, your browser does not support copying.&#34;: [&#34;&#34;], &#34;SQL Copied!&#34;: [&#34;&#34;], &#34;The passwords for the databases below are needed in order to import them. Please note that the \&#34;Secure Extra\&#34; and \&#34;Certificate\&#34; sections of the database configuration are not present in export files, and should be added manually after the import if they are needed.&#34;: [&#34;&#34;], &#34;You are importing one or more databases that already exist. Overwriting might cause you to lose some of your work. Are you sure you want to overwrite?&#34;: [&#34;&#34;], &#34;database&#34;: [&#34;&#34;], &#34;An error occurred while fetching database related data: %s&#34;: [&#34;&#34;], &#34;Asynchronous query execution&#34;: [&#34;&#34;], &#34;AQE&#34;: [&#34;&#34;], &#34;Allow data manipulation language&#34;: [&#34;&#34;], &#34;DML&#34;: [&#34;&#34;], &#34;CSV upload&#34;: [&#34;&#34;], &#34;Delete database&#34;: [&#34;&#34;], &#34;The database %s is linked to %s charts that appear on %s dashboards. Are you sure you want to continue? Deleting the database will break those objects.&#34;: [&#34;&#34;], &#34;Delete Database?&#34;: [&#34;&#34;], &#34;Please enter a SQLAlchemy URI to test&#34;: [&#34;&#34;], &#34;Connection looks good!&#34;: [&#34;&#34;], &#34;ERROR: Connection failed. &#34;: [&#34;&#34;], &#34;Sorry there was an error fetching database information: %s&#34;: [&#34;&#34;], &#34;Edit database&#34;: [&#34;&#34;], &#34;Add database&#34;: [&#34;&#34;], &#34;Connection&#34;: [&#34;&#34;], &#34;Database name&#34;: [&#34;&#34;], &#34;Name your dataset&#34;: [&#34;&#34;], &#34;dialect+driver://username:password@host:port/database&#34;: [&#34;&#34;], &#34;Test connection&#34;: [&#34;&#34;], &#34;Refer to the &#34;: [&#34;&#34;], &#34;SQLAlchemy docs&#34;: [&#34;&#34;], &#34; for more information on how to structure your URI.&#34;: [&#34;&#34;], &#34;Performance&#34;: [&#34;&#34;], &#34;Chart cache timeout&#34;: [&#34;&#34;], &#34;Operate the database in asynchronous mode, meaning that the queries are executed on remote workers as opposed to on the web server itself. This assumes that you have a Celery worker setup as well as a results backend. Refer to the installation docs for more information.&#34;: [&#34;&#34;], &#34;SQL Lab settings&#34;: [&#34;&#34;], &#34;Allow users to run non-SELECT statements (UPDATE, DELETE, CREATE, ...)&#34;: [&#34;&#34;], &#34;Allow multi schema metadata fetch&#34;: [&#34;&#34;], &#34;CTAS schema&#34;: [&#34;&#34;], &#34;When allowing CREATE TABLE AS option in SQL Lab, this option forces the table to be created in this schema.&#34;: [&#34;&#34;], &#34;Secure extra&#34;: [&#34;&#34;], &#34;JSON string containing additional connection configuration.&#34;: [&#34;&#34;], &#34;This is used to provide connection information for systems like Hive, Presto, and BigQuery, which do not conform to the username:password syntax normally used by SQLAlchemy.&#34;: [&#34;&#34;], &#34;Optional CA_BUNDLE contents to validate HTTPS requests. Only available on certain database engines.&#34;: [&#34;&#34;], &#34;Impersonate Logged In User (Presto, Trino, Drill &amp; Hive)&#34;: [&#34;&#34;], &#34;If Presto, Trino or Drill all the queries in SQL Lab are going to be executed as the currently logged on user who must have permission to run them. If Hive and hive.server2.enable.doAs is enabled, will run the queries as service account, but impersonate the currently logged on user via hive.server2.proxy.user property.&#34;: [&#34;&#34;], &#34;Allow data upload&#34;: [&#34;&#34;], &#34;If selected, please set the schemas allowed for data upload in Extra.&#34;: [&#34;&#34;], &#34;JSON string containing extra configuration elements.&#34;: [&#34;&#34;], &#34;1. The engine_params object gets unpacked into the sqlalchemy.create_engine call, while the metadata_params gets unpacked into the sqlalchemy.MetaData call.&#34;: [&#34;&#34;], &#34;2. The metadata_cache_timeout is a cache timeout setting in seconds for metadata fetch of this database. Specify it as \&#34;metadata_cache_timeout\&#34;: {\&#34;schema_cache_timeout\&#34;: 600, \&#34;table_cache_timeout\&#34;: 600}. If unset, cache will not be enabled for the functionality. A timeout of 0 indicates that the cache never expires.&#34;: [&#34;&#34;], &#34;3. The schemas_allowed_for_file_upload is a comma separated list of schemas that CSVs are allowed to upload to. Specify it as \&#34;schemas_allowed_for_file_upload\&#34;: [\&#34;public\&#34;, \&#34;csv_upload\&#34;]. If database flavor does not support schema or any schema is allowed to be accessed, just leave the list empty.&#34;: [&#34;&#34;], &#34;4. The version field is a string specifying this db&#39;s version. This should be used with Presto DBs so that the syntax is correct.&#34;: [&#34;&#34;], &#34;5. The allows_virtual_table_explore field is a boolean specifying whether or not the Explore button in SQL Lab results is shown.&#34;: [&#34;&#34;], &#34;Error while saving dataset: %s&#34;: [&#34;&#34;], &#34;Add dataset&#34;: [&#34;&#34;], &#34;The passwords for the databases below are needed in order to import them together with the datasets. Please note that the \&#34;Secure Extra\&#34; and \&#34;Certificate\&#34; sections of the database configuration are not present in export files, and should be added manually after the import if they are needed.&#34;: [&#34;&#34;], &#34;You are importing one or more datasets that already exist. Overwriting might cause you to lose some of your work. Are you sure you want to overwrite?&#34;: [&#34;&#34;], &#34;An error occurred while fetching dataset related data&#34;: [&#34;&#34;], &#34;An error occurred while fetching dataset related data: %s&#34;: [&#34;&#34;], &#34;Physical dataset&#34;: [&#34;&#34;], &#34;Virtual dataset&#34;: [&#34;&#34;], &#34;An error occurred while fetching dataset owner values: %s&#34;: [&#34;&#34;], &#34;An error occurred while fetching datasets: %s&#34;: [&#34;&#34;], &#34;An error occurred while fetching schema values: %s&#34;: [&#34;&#34;], &#34;There was an issue deleting the selected datasets: %s&#34;: [&#34;&#34;], &#34;The dataset %s is linked to %s charts that appear on %s dashboards. Are you sure you want to continue? Deleting the dataset will break those objects.&#34;: [&#34;&#34;], &#34;Delete Dataset?&#34;: [&#34;&#34;], &#34;Are you sure you want to delete the selected datasets?&#34;: [&#34;&#34;], &#34;0 Selected&#34;: [&#34;&#34;], &#34;%s Selected (Virtual)&#34;: [&#34;&#34;], &#34;%s Selected (Physical)&#34;: [&#34;&#34;], &#34;%s Selected (%s Physical, %s Virtual)&#34;: [&#34;&#34;], &#34;There was an issue previewing the selected query. %s&#34;: [&#34;&#34;], &#34;Success&#34;: [&#34;&#34;], &#34;Failed&#34;: [&#34;&#34;], &#34;Running&#34;: [&#34;&#34;], &#34;Offline&#34;: [&#34;&#34;], &#34;Scheduled&#34;: [&#34;&#34;], &#34;Duration: %s&#34;: [&#34;&#34;], &#34;Tab name&#34;: [&#34;&#34;], &#34;TABLES&#34;: [&#34;&#34;], &#34;Rows&#34;: [&#34;&#34;], &#34;Open query in SQL Lab&#34;: [&#34;&#34;], &#34;An error occurred while fetching database values: %s&#34;: [&#34;&#34;], &#34;Search by query text&#34;: [&#34;&#34;], &#34;Query preview&#34;: [&#34;&#34;], &#34;Previous&#34;: [&#34;&#34;], &#34;Next&#34;: [&#34;&#34;], &#34;Open in SQL Lab&#34;: [&#34;&#34;], &#34;User query&#34;: [&#34;&#34;], &#34;Executed query&#34;: [&#34;&#34;], &#34;Saved queries&#34;: [&#34;&#34;], &#34;There was an issue previewing the selected query %s&#34;: [&#34;&#34;], &#34;Link Copied!&#34;: [&#34;&#34;], &#34;There was an issue deleting the selected queries: %s&#34;: [&#34;&#34;], &#34;Edit query&#34;: [&#34;&#34;], &#34;Copy query URL&#34;: [&#34;&#34;], &#34;Delete query&#34;: [&#34;&#34;], &#34;This action will permanently delete the saved query.&#34;: [&#34;&#34;], &#34;Delete Query?&#34;: [&#34;&#34;], &#34;Are you sure you want to delete the selected queries?&#34;: [&#34;&#34;], &#34;Query name&#34;: [&#34;&#34;], &#34;Edited&#34;: [&#34;&#34;], &#34;Created&#34;: [&#34;&#34;], &#34;Viewed&#34;: [&#34;&#34;], &#34;Examples&#34;: [&#34;&#34;], &#34;Mine&#34;: [&#34;&#34;], &#34;Recently viewed charts, dashboards, and saved queries will appear here&#34;: [&#34;&#34;], &#34;Recently created charts, dashboards, and saved queries will appear here&#34;: [&#34;&#34;], &#34;Recent example charts, dashboards, and saved queries will appear here&#34;: [&#34;&#34;], &#34;Recently edited charts, dashboards, and saved queries will appear here&#34;: [&#34;&#34;], &#34;${tableName\n                        .split(&#39;&#39;)\n                        .slice(0, tableName.length - 1)\n                        .join(&#39;&#39;)}\n                    &#34;: [&#34;&#34;], &#34;You don&#39;t have any favorites yet!&#34;: [&#34;&#34;], &#34;SQL Lab queries&#34;: [&#34;&#34;], &#34;${tableName}&#34;: [&#34;&#34;], &#34;query&#34;: [&#34;&#34;], &#34;Share&#34;: [&#34;&#34;], &#34;Last run %s&#34;: [&#34;&#34;], &#34;Recents&#34;: [&#34;&#34;], &#34;Select start and end date&#34;: [&#34;&#34;], &#34;Type or Select [%s]&#34;: [&#34;&#34;], &#34;Filter box&#34;: [&#34;&#34;], &#34;Filters configuration&#34;: [&#34;&#34;], &#34;Filter configuration for the filter box&#34;: [&#34;&#34;], &#34;Date filter&#34;: [&#34;&#34;], &#34;Whether to include a time filter&#34;: [&#34;&#34;], &#34;Instant filtering&#34;: [&#34;&#34;], &#34;Check to apply filters instantly as they change instead of displaying [Apply] button&#34;: [&#34;&#34;], &#34;Show SQL granularity dropdown&#34;: [&#34;&#34;], &#34;Check to include SQL granularity dropdown&#34;: [&#34;&#34;], &#34;Show SQL time column&#34;: [&#34;&#34;], &#34;Check to include time column dropdown&#34;: [&#34;&#34;], &#34;Show Druid granularity dropdown&#34;: [&#34;&#34;], &#34;Check to include Druid granularity dropdown&#34;: [&#34;&#34;], &#34;Show Druid time origin&#34;: [&#34;&#34;], &#34;Check to include time origin dropdown&#34;: [&#34;&#34;], &#34;Limit selector values&#34;: [&#34;&#34;], &#34;These filters apply to the values available in the dropdowns&#34;: [&#34;&#34;], &#34;Time-series Table&#34;: [&#34;&#34;]}}}, &#34;feature_flags&#34;: {&#34;ALLOW_DASHBOARD_DOMAIN_SHARDING&#34;: true, &#34;CLIENT_CACHE&#34;: false, &#34;DISABLE_DATASET_SOURCE_EDIT&#34;: false, &#34;DRUID_JOINS&#34;: false, &#34;DYNAMIC_PLUGINS&#34;: false, &#34;DISABLE_LEGACY_DATASOURCE_EDITOR&#34;: true, &#34;ENABLE_EXPLORE_JSON_CSRF_PROTECTION&#34;: false, &#34;ENABLE_TEMPLATE_PROCESSING&#34;: true, &#34;ENABLE_TEMPLATE_REMOVE_FILTERS&#34;: false, &#34;ENABLE_JAVASCRIPT_CONTROLS&#34;: false, &#34;KV_STORE&#34;: false, &#34;PRESTO_EXPAND_DATA&#34;: false, &#34;THUMBNAILS&#34;: false, &#34;DASHBOARD_CACHE&#34;: false, &#34;REMOVE_SLICE_LEVEL_LABEL_COLORS&#34;: false, &#34;SHARE_QUERIES_VIA_KV_STORE&#34;: false, &#34;TAGGING_SYSTEM&#34;: false, &#34;SQLLAB_BACKEND_PERSISTENCE&#34;: true, &#34;LISTVIEWS_DEFAULT_CARD_VIEW&#34;: false, &#34;DISPLAY_MARKDOWN_HTML&#34;: true, &#34;ESCAPE_MARKDOWN_HTML&#34;: false, &#34;DASHBOARD_NATIVE_FILTERS&#34;: true, &#34;DASHBOARD_CROSS_FILTERS&#34;: true, &#34;DASHBOARD_NATIVE_FILTERS_SET&#34;: true, &#34;DASHBOARD_FILTERS_EXPERIMENTAL&#34;: true, &#34;DASHBOARD_VIRTUALIZATION&#34;: false, &#34;GLOBAL_ASYNC_QUERIES&#34;: false, &#34;VERSIONED_EXPORT&#34;: true, &#34;EMBEDDED_SUPERSET&#34;: true, &#34;ALERT_REPORTS&#34;: true, &#34;DASHBOARD_RBAC&#34;: true, &#34;ENABLE_EXPLORE_DRAG_AND_DROP&#34;: true, &#34;ENABLE_FILTER_BOX_MIGRATION&#34;: false, &#34;ENABLE_ADVANCED_DATA_TYPES&#34;: false, &#34;ENABLE_DND_WITH_CLICK_UX&#34;: true, &#34;ALERTS_ATTACH_REPORTS&#34;: true, &#34;FORCE_DATABASE_CONNECTIONS_SSL&#34;: false, &#34;ENFORCE_DB_ENCRYPTION_UI&#34;: false, &#34;ALLOW_FULL_CSV_EXPORT&#34;: false, &#34;UX_BETA&#34;: false, &#34;GENERIC_CHART_AXES&#34;: false, &#34;ALLOW_ADHOC_SUBQUERY&#34;: false, &#34;USE_ANALAGOUS_COLORS&#34;: false, &#34;DASHBOARD_EDIT_CHART_IN_NEW_TAB&#34;: false, &#34;RLS_IN_SQLLAB&#34;: false, &#34;CACHE_IMPERSONATION&#34;: false, &#34;EMBEDDABLE_CHARTS&#34;: true, &#34;DRILL_TO_DETAIL&#34;: false, &#34;DATAPANEL_CLOSED_BY_DEFAULT&#34;: false, &#34;HORIZONTAL_FILTER_BAR&#34;: false, &#34;ESTIMATE_QUERY_COST&#34;: false, &#34;SSH_TUNNELING&#34;: false}, &#34;extra_sequential_color_schemes&#34;: [], &#34;extra_categorical_color_schemes&#34;: [], &#34;theme_overrides&#34;: {}, &#34;menu_data&#34;: {&#34;menu&#34;: [{&#34;name&#34;: &#34;Security&#34;, &#34;icon&#34;: &#34;fa-cogs&#34;, &#34;label&#34;: &#34;Security&#34;, &#34;childs&#34;: [{&#34;name&#34;: &#34;List Users&#34;, &#34;icon&#34;: &#34;fa-user&#34;, &#34;label&#34;: &#34;List Users&#34;, &#34;url&#34;: &#34;/users/list/&#34;}, {&#34;name&#34;: &#34;List Roles&#34;, &#34;icon&#34;: &#34;fa-group&#34;, &#34;label&#34;: &#34;List Roles&#34;, &#34;url&#34;: &#34;/roles/list/&#34;}, &#34;-&#34;, {&#34;name&#34;: &#34;Row Level Security&#34;, &#34;icon&#34;: &#34;fa-lock&#34;, &#34;label&#34;: &#34;Row Level Security&#34;, &#34;url&#34;: &#34;/rowlevelsecurityfiltersmodelview/list/&#34;}, {&#34;name&#34;: &#34;Action Log&#34;, &#34;icon&#34;: &#34;fa-list-ol&#34;, &#34;label&#34;: &#34;Action Log&#34;, &#34;url&#34;: &#34;/logmodelview/list/&#34;}]}, {&#34;name&#34;: &#34;Data&#34;, &#34;icon&#34;: &#34;&#34;, &#34;label&#34;: &#34;Data&#34;, &#34;childs&#34;: [{&#34;name&#34;: &#34;Databases&#34;, &#34;icon&#34;: &#34;fa-database&#34;, &#34;label&#34;: &#34;Database Connections&#34;, &#34;url&#34;: &#34;/databaseview/list/&#34;}]}, {&#34;name&#34;: &#34;Dashboards&#34;, &#34;icon&#34;: &#34;fa-dashboard&#34;, &#34;label&#34;: &#34;Dashboards&#34;, &#34;url&#34;: &#34;/dashboard/list/&#34;}, {&#34;name&#34;: &#34;Charts&#34;, &#34;icon&#34;: &#34;fa-bar-chart&#34;, &#34;label&#34;: &#34;Charts&#34;, &#34;url&#34;: &#34;/chart/list/&#34;}, {&#34;name&#34;: &#34;Datasets&#34;, &#34;icon&#34;: &#34;fa-table&#34;, &#34;label&#34;: &#34;Datasets&#34;, &#34;url&#34;: &#34;/tablemodelview/list/&#34;}, {&#34;name&#34;: &#34;Manage&#34;, &#34;icon&#34;: &#34;&#34;, &#34;label&#34;: &#34;Manage&#34;, &#34;childs&#34;: [{&#34;name&#34;: &#34;CSS Templates&#34;, &#34;icon&#34;: &#34;fa-css3&#34;, &#34;label&#34;: &#34;CSS Templates&#34;, &#34;url&#34;: &#34;/csstemplatemodelview/list/&#34;}, {&#34;name&#34;: &#34;Alerts &amp; Report&#34;, &#34;icon&#34;: &#34;fa-exclamation-triangle&#34;, &#34;label&#34;: &#34;Alerts &amp; Reports&#34;, &#34;url&#34;: &#34;/alert/list/&#34;}, {&#34;name&#34;: &#34;Annotation Layers&#34;, &#34;icon&#34;: &#34;fa-comment&#34;, &#34;label&#34;: &#34;Annotation Layers&#34;, &#34;url&#34;: &#34;/annotationlayer/list/&#34;}]}, {&#34;name&#34;: &#34;SQL Lab&#34;, &#34;icon&#34;: &#34;fa-flask&#34;, &#34;label&#34;: &#34;SQL&#34;, &#34;childs&#34;: [{&#34;name&#34;: &#34;SQL Editor&#34;, &#34;icon&#34;: &#34;fa-flask&#34;, &#34;label&#34;: &#34;SQL Lab&#34;, &#34;url&#34;: &#34;/superset/sqllab/&#34;}, {&#34;name&#34;: &#34;Saved Queries&#34;, &#34;icon&#34;: &#34;fa-save&#34;, &#34;label&#34;: &#34;Saved Queries&#34;, &#34;url&#34;: &#34;/savedqueryview/list/&#34;}, {&#34;name&#34;: &#34;Query Search&#34;, &#34;icon&#34;: &#34;fa-search&#34;, &#34;label&#34;: &#34;Query History&#34;, &#34;url&#34;: &#34;/superset/sqllab/history/&#34;}]}], &#34;brand&#34;: {&#34;path&#34;: &#34;/superset/welcome/&#34;, &#34;icon&#34;: &#34;/static/assets/images/teias-logo.jpg&#34;, &#34;alt&#34;: &#34;TEIAS Geli\u015fmi\u015f Raporlama&#34;, &#34;tooltip&#34;: &#34;&#34;, &#34;text&#34;: &#34;&#34;}, &#34;environment_tag&#34;: {&#34;color&#34;: &#34;&#34;, &#34;text&#34;: &#34;&#34;}, &#34;navbar_right&#34;: {&#34;show_watermark&#34;: true, &#34;bug_report_url&#34;: null, &#34;bug_report_icon&#34;: null, &#34;bug_report_text&#34;: &#34;Report a bug&#34;, &#34;documentation_url&#34;: null, &#34;documentation_icon&#34;: null, &#34;documentation_text&#34;: &#34;Documentation&#34;, &#34;version_string&#34;: &#34;2.1.0&#34;, &#34;version_sha&#34;: &#34;&#34;, &#34;build_number&#34;: null, &#34;languages&#34;: {&#34;en&#34;: {&#34;flag&#34;: &#34;us&#34;, &#34;name&#34;: &#34;English&#34;, &#34;url&#34;: &#34;/lang/en&#34;}}, &#34;show_language_picker&#34;: false, &#34;user_is_anonymous&#34;: false, &#34;user_info_url&#34;: &#34;/users/userinfo/&#34;, &#34;user_logout_url&#34;: &#34;/logout/&#34;, &#34;user_login_url&#34;: &#34;/login/&#34;, &#34;user_profile_url&#34;: &#34;/superset/profile/murathanyeniceli&#34;, &#34;locale&#34;: &#34;en&#34;}}, &#34;flash_messages&#34;: []}}">
            <img src="/static/assets/images/loading.gif" style="width: 50px; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%)">
        </div>
        <!-- Modal for misc messages / alerts  -->
        <div class="misc-modal modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content" data-test="modal-content">
                    <div class="modal-header" data-test="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close" data-test="modal-header-close-button">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 data-test="modal-title" class="modal-title"></h4>
                    </div>
                    <div data-test="modal-body" class="modal-body"></div>
                    <div data-test="modal-footer" class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Bundle js spa START -->
        <script src="/static/assets/vendors.d43e1060c583584b42b0.entry.js" async></script>
        <script src="/static/assets/thumbnail.f7f91866e420f4d9227b.entry.js" async></script>
        <script src="/static/assets/2450.3b69db705792b977f21f.entry.js" async></script>
        <script src="/static/assets/8494.23c0da2cdd2ac2f1b463.entry.js" async></script>
        <script src="/static/assets/2318.37f87103f36c4a241f81.entry.js" async></script>
        <script src="/static/assets/8453.8a504cef172fd4d4fb46.entry.js" async></script>
        <script src="/static/assets/7167.e4eb69c6899ea4caab27.entry.js" async></script>
        <script src="/static/assets/678.4fa1386c7aeeb1cacd8a.entry.js" async></script>
        <script src="/static/assets/8767.e99bd9bd2f429864b6f0.entry.js" async></script>
        <script src="/static/assets/6140.ba157c2bc31cfc4db166.entry.js" async></script>
        <script src="/static/assets/2087.d090220e75d89441b289.entry.js" async></script>
        <script src="/static/assets/5755.49c32b0c08d84d9729b8.entry.js" async></script>
        <script src="/static/assets/845.841ad39038c010354064.entry.js" async></script>
        <script src="/static/assets/5640.d16ad9020fbf76e46301.entry.js" async></script>
        <script src="/static/assets/9602.9823b4ffc1b5aed9ad5b.entry.js" async></script>
        <script src="/static/assets/5010.f537a206740bfd304ec4.entry.js" async></script>
        <script src="/static/assets/8047.303867f305db6e4fcadc.entry.js" async></script>
        <script src="/static/assets/8888.c84ce1acf4e9ffef54c0.entry.js" async></script>
        <script src="/static/assets/9507.d8ac1fa574b5e437dfd6.entry.js" async></script>
        <script src="/static/assets/8989.633f713fdcbeaf3ed8b4.entry.js" async></script>
        <script src="/static/assets/9454.92d970abfa1ec9119fbf.entry.js" async></script>
        <script src="/static/assets/6839.ae70978ec259eb357ed5.entry.js" async></script>
        <script src="/static/assets/9772.25b06b5374ee1ca395bb.entry.js" async></script>
        <script src="/static/assets/DashboardPage.92c726fc4742c10e33f7.entry.js" async></script>
        <script src="/static/assets/7230.d7ed877e939bdd93876e.entry.js" async></script>
        <script src="/static/assets/4717.8e09128be65156c7664e.entry.js" async></script>
        <script src="/static/assets/spa.1629290a858fb4c14b5b.entry.js" async></script>
        <!-- Bundle js spa END -->
    </body>
</html>


{
    "result": {
        "certification_details": "",
        "certified_by": "",
        "changed_by": {
            "first_name": "Murathan",
            "id": 60,
            "last_name": "YENICELI",
            "username": "murathanyeniceli"
        },
        "changed_by_name": "Murathan YENICELI",
        "changed_by_url": "/superset/profile/murathanyeniceli",
        "changed_on": "2026-04-12T23:47:29.992633",
        "changed_on_delta_humanized": "7 days ago",
        "charts": [
            "Golbasi_YTM_P"
        ],
        "css": "",
        "dashboard_title": "GOLBASI_YTM_P",
        "id": 89,
        "is_managed_externally": false,
        "json_metadata": "{\"show_native_filters\": true, \"chart_configuration\": {\"454\": {\"id\": 454, \"crossFilters\": {\"scope\": {\"rootPath\": [\"ROOT_ID\"], \"excluded\": [454]}, \"chartsInScope\": [287]}}}, \"color_scheme\": \"\", \"refresh_frequency\": 0, \"shared_label_colors\": {}, \"color_scheme_domain\": [], \"expanded_slices\": {}, \"label_colors\": {}, \"timed_refresh_immune_slices\": [], \"cross_filters_enabled\": true, \"default_filters\": \"{}\"}",
        "owners": [
            {
                "first_name": "Murathan",
                "id": 60,
                "last_name": "YENICELI",
                "username": "murathanyeniceli"
            }
        ],
        "position_json": "{\"CHART-explore-454-1\":{\"children\":[],\"id\":\"CHART-explore-454-1\",\"meta\":{\"chartId\":454,\"height\":75,\"sliceName\":\"Golbasi_YTM_P\",\"uuid\":\"96755931-178b-42dd-a771-5d732756a3cf\",\"width\":12},\"parents\":[\"ROOT_ID\",\"GRID_ID\",\"ROW-983b6mo3s5p\"],\"type\":\"CHART\"},\"DASHBOARD_VERSION_KEY\":\"v2\",\"GRID_ID\":{\"children\":[\"ROW-983b6mo3s5p\"],\"id\":\"GRID_ID\",\"parents\":[\"ROOT_ID\"],\"type\":\"GRID\"},\"HEADER_ID\":{\"id\":\"HEADER_ID\",\"meta\":{\"text\":\"GOLBASI_YTM_P\"},\"type\":\"HEADER\"},\"ROOT_ID\":{\"children\":[\"GRID_ID\"],\"id\":\"ROOT_ID\",\"type\":\"ROOT\"},\"ROW-983b6mo3s5p\":{\"children\":[\"CHART-explore-454-1\"],\"id\":\"ROW-983b6mo3s5p\",\"meta\":{\"0\":\"ROOT_ID\",\"background\":\"BACKGROUND_TRANSPARENT\"},\"parents\":[\"ROOT_ID\",\"GRID_ID\"],\"type\":\"ROW\"}}",
        "published": false,
        "roles": [],
        "slug": null,
        "thumbnail_url": "/api/v1/dashboard/89/thumbnail/e314ac496328161d9ddcfeb878187dfc/",
        "url": "/superset/dashboard/89/"
    }
}

{
    "result": [
        {
            "cache_timeout": 3600,
            "column_formats": {},
            "column_types": [
                0,
                1,
                2
            ],
            "columns": [
                {
                    "advanced_data_type": null,
                    "certification_details": null,
                    "certified_by": null,
                    "column_name": "sinsid",
                    "description": null,
                    "expression": null,
                    "filterable": true,
                    "groupby": true,
                    "id": 52,
                    "is_certified": false,
                    "is_dttm": false,
                    "python_date_format": null,
                    "type": "STRING",
                    "type_generic": 1,
                    "verbose_name": null,
                    "warning_markdown": null
                },
                {
                    "advanced_data_type": null,
                    "certification_details": null,
                    "certified_by": null,
                    "column_name": "tear",
                    "description": null,
                    "expression": null,
                    "filterable": true,
                    "groupby": true,
                    "id": 55,
                    "is_certified": false,
                    "is_dttm": false,
                    "python_date_format": null,
                    "type": "STRING",
                    "type_generic": 1,
                    "verbose_name": "BYTM",
                    "warning_markdown": null
                },
                {
                    "advanced_data_type": null,
                    "certification_details": null,
                    "certified_by": null,
                    "column_name": "__time",
                    "description": null,
                    "expression": null,
                    "filterable": true,
                    "groupby": true,
                    "id": 30,
                    "is_certified": false,
                    "is_dttm": true,
                    "python_date_format": null,
                    "type": "LONG",
                    "type_generic": 2,
                    "verbose_name": null,
                    "warning_markdown": null
                },
                {
                    "advanced_data_type": null,
                    "certification_details": null,
                    "certified_by": null,
                    "column_name": "b1Name",
                    "description": null,
                    "expression": null,
                    "filterable": true,
                    "groupby": true,
                    "id": 31,
                    "is_certified": false,
                    "is_dttm": false,
                    "python_date_format": null,
                    "type": "STRING",
                    "type_generic": 1,
                    "verbose_name": "TM (b1Name)",
                    "warning_markdown": null
                },
                {
                    "advanced_data_type": null,
                    "certification_details": null,
                    "certified_by": null,
                    "column_name": "b2Name",
                    "description": null,
                    "expression": null,
                    "filterable": true,
                    "groupby": true,
                    "id": 33,
                    "is_certified": false,
                    "is_dttm": false,
                    "python_date_format": null,
                    "type": "STRING",
                    "type_generic": 1,
                    "verbose_name": null,
                    "warning_markdown": null
                },
                {
                    "advanced_data_type": null,
                    "certification_details": null,
                    "certified_by": null,
                    "column_name": "b3Name",
                    "description": null,
                    "expression": null,
                    "filterable": true,
                    "groupby": true,
                    "id": 35,
                    "is_certified": false,
                    "is_dttm": false,
                    "python_date_format": null,
                    "type": "STRING",
                    "type_generic": 1,
                    "verbose_name": null,
                    "warning_markdown": null
                },
                {
                    "advanced_data_type": null,
                    "certification_details": null,
                    "certified_by": null,
                    "column_name": "elementName",
                    "description": null,
                    "expression": null,
                    "filterable": true,
                    "groupby": true,
                    "id": 39,
                    "is_certified": false,
                    "is_dttm": false,
                    "python_date_format": null,
                    "type": "STRING",
                    "type_generic": 1,
                    "verbose_name": null,
                    "warning_markdown": null
                },
                {
                    "advanced_data_type": null,
                    "certification_details": null,
                    "certified_by": null,
                    "column_name": "maxValue",
                    "description": null,
                    "expression": null,
                    "filterable": true,
                    "groupby": true,
                    "id": 43,
                    "is_certified": false,
                    "is_dttm": false,
                    "python_date_format": null,
                    "type": "FLOAT",
                    "type_generic": 0,
                    "verbose_name": null,
                    "warning_markdown": null
                }
            ],
            "database": {
                "allows_cost_estimate": false,
                "allows_subquery": true,
                "allows_virtual_table_explore": true,
                "backend": "druid",
                "disable_data_preview": false,
                "explore_database_id": 2,
                "id": 2,
                "name": "druid"
            },
            "datasource_name": "teias-analog-aggregate",
            "default_endpoint": null,
            "edit_url": "/tablemodelview/edit/3",
            "fetch_values_predicate": null,
            "filter_select": false,
            "filter_select_enabled": false,
            "granularity_sqla": [
                [
                    "__time",
                    "__time"
                ]
            ],
            "health_check_message": null,
            "id": 3,
            "is_sqllab_view": false,
            "main_dttm_col": "__time",
            "metrics": [],
            "name": "druid.teias-analog-aggregate",
            "offset": 0,
            "order_by_choices": [
                [
                    "[\"<new column>\", true]",
                    "<new column> [asc]"
                ],
                [
                    "[\"<new column>\", false]",
                    "<new column> [desc]"
                ],
                [
                    "[\"__time\", true]",
                    "__time [asc]"
                ],
                [
                    "[\"__time\", false]",
                    "__time [desc]"
                ],
                [
                    "[\"b1Name\", true]",
                    "b1Name [asc]"
                ],
                [
                    "[\"b1Name\", false]",
                    "b1Name [desc]"
                ],
                [
                    "[\"b1NameBm\", true]",
                    "b1NameBm [asc]"
                ],
                [
                    "[\"b1NameBm\", false]",
                    "b1NameBm [desc]"
                ],
                [
                    "[\"b1Text\", true]",
                    "b1Text [asc]"
                ],
                [
                    "[\"b1Text\", false]",
                    "b1Text [desc]"
                ],
                [
                    "[\"b2Name\", true]",
                    "b2Name [asc]"
                ],
                [
                    "[\"b2Name\", false]",
                    "b2Name [desc]"
                ],
                [
                    "[\"b2Text\", true]",
                    "b2Text [asc]"
                ],
                [
                    "[\"b2Text\", false]",
                    "b2Text [desc]"
                ],
                [
                    "[\"b3Name\", true]",
                    "b3Name [asc]"
                ],
                [
                    "[\"b3Name\", false]",
                    "b3Name [desc]"
                ],
                [
                    "[\"b3Text\", true]",
                    "b3Text [asc]"
                ],
                [
                    "[\"b3Text\", false]",
                    "b3Text [desc]"
                ],
                [
                    "[\"bilo\", true]",
                    "bilo [asc]"
                ],
                [
                    "[\"bilo\", false]",
                    "bilo [desc]"
                ],
                [
                    "[\"count\", true]",
                    "count [asc]"
                ],
                [
                    "[\"count\", false]",
                    "count [desc]"
                ],
                [
                    "[\"elementName\", true]",
                    "elementName [asc]"
                ],
                [
                    "[\"elementName\", false]",
                    "elementName [desc]"
                ],
                [
                    "[\"elementText\", true]",
                    "elementText [asc]"
                ],
                [
                    "[\"elementText\", false]",
                    "elementText [desc]"
                ],
                [
                    "[\"elementType\", true]",
                    "elementType [asc]"
                ],
                [
                    "[\"elementType\", false]",
                    "elementType [desc]"
                ],
                [
                    "[\"firstValue\", true]",
                    "firstValue [asc]"
                ],
                [
                    "[\"firstValue\", false]",
                    "firstValue [desc]"
                ],
                [
                    "[\"infoName\", true]",
                    "infoName [asc]"
                ],
                [
                    "[\"infoName\", false]",
                    "infoName [desc]"
                ],
                [
                    "[\"lastValue\", true]",
                    "lastValue [asc]"
                ],
                [
                    "[\"lastValue\", false]",
                    "lastValue [desc]"
                ],
                [
                    "[\"maxValue\", true]",
                    "maxValue [asc]"
                ],
                [
                    "[\"maxValue\", false]",
                    "maxValue [desc]"
                ],
                [
                    "[\"minValue\", true]",
                    "minValue [asc]"
                ],
                [
                    "[\"minValue\", false]",
                    "minValue [desc]"
                ],
                [
                    "[\"noel\", true]",
                    "noel [asc]"
                ],
                [
                    "[\"noel\", false]",
                    "noel [desc]"
                ],
                [
                    "[\"noelNimset\", true]",
                    "noelNimset [asc]"
                ],
                [
                    "[\"noelNimset\", false]",
                    "noelNimset [desc]"
                ],
                [
                    "[\"q0\", true]",
                    "q0 [asc]"
                ],
                [
                    "[\"q0\", false]",
                    "q0 [desc]"
                ],
                [
                    "[\"q1\", true]",
                    "q1 [asc]"
                ],
                [
                    "[\"q1\", false]",
                    "q1 [desc]"
                ],
                [
                    "[\"scadaEventType\", true]",
                    "scadaEventType [asc]"
                ],
                [
                    "[\"scadaEventType\", false]",
                    "scadaEventType [desc]"
                ],
                [
                    "[\"sinsid\", true]",
                    "sinsid [asc]"
                ],
                [
                    "[\"sinsid\", false]",
                    "sinsid [desc]"
                ],
                [
                    "[\"sumValue\", true]",
                    "sumValue [asc]"
                ],
                [
                    "[\"sumValue\", false]",
                    "sumValue [desc]"
                ],
                [
                    "[\"tear\", true]",
                    "tear [asc]"
                ],
                [
                    "[\"tear\", false]",
                    "tear [desc]"
                ],
                [
                    "[\"triggerType\", true]",
                    "triggerType [asc]"
                ],
                [
                    "[\"triggerType\", false]",
                    "triggerType [desc]"
                ],
                [
                    "[\"type\", true]",
                    "type [asc]"
                ],
                [
                    "[\"type\", false]",
                    "type [desc]"
                ],
                [
                    "[\"username\", true]",
                    "username [asc]"
                ],
                [
                    "[\"username\", false]",
                    "username [desc]"
                ]
            ],
            "owners": [
                {
                    "first_name": "emre",
                    "id": 2,
                    "last_name": "komurcu",
                    "username": "ekomurcu"
                }
            ],
            "params": null,
            "perm": "[druid].[teias-analog-aggregate](id:3)",
            "schema": "druid",
            "select_star": "SELECT *\nFROM \"druid\".\"teias-analog-aggregate\"\nLIMIT 100",
            "sql": "",
            "table_name": "teias-analog-aggregate",
            "template_params": null,
            "time_grain_sqla": [
                [
                    "PT1S",
                    "Second"
                ],
                [
                    "PT5S",
                    "5 second"
                ],
                [
                    "PT30S",
                    "30 second"
                ],
                [
                    "PT1M",
                    "Minute"
                ],
                [
                    "PT5M",
                    "5 minute"
                ],
                [
                    "PT10M",
                    "10 minute"
                ],
                [
                    "PT15M",
                    "15 minute"
                ],
                [
                    "PT30M",
                    "30 minute"
                ],
                [
                    "PT1H",
                    "Hour"
                ],
                [
                    "PT6H",
                    "6 hour"
                ],
                [
                    "P1D",
                    "Day"
                ],
                [
                    "P1W",
                    "Week"
                ],
                [
                    "P1M",
                    "Month"
                ],
                [
                    "P3M",
                    "Quarter"
                ],
                [
                    "P1Y",
                    "Year"
                ],
                [
                    "P1W/1970-01-03T00:00:00Z",
                    "Week ending Saturday"
                ],
                [
                    "1969-12-28T00:00:00Z/P1W",
                    "Week starting Sunday"
                ]
            ],
            "type": "table",
            "uid": "3__table",
            "verbose_map": {
                "__time": "__time",
                "__timestamp": "Time",
                "b1Name": "TM (b1Name)",
                "b2Name": "b2Name",
                "b3Name": "b3Name",
                "elementName": "elementName",
                "maxValue": "maxValue",
                "sinsid": "sinsid",
                "tear": "BYTM"
            }
        }
    ]
}
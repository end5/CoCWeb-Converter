interface zxcv {}

class qwer {}

class asdf extends qwer implements zxcv {
    private num: number;
    private obj: { num: number, [x: string]: number };
    public constructor() {
        super();
        this.obj = { num: 0 };
        this.obj.num = 0;
        this.obj[0] = 1;
        if (this == null) {
            this.num = 0;
        }
    }
    // asdf
    // qwer
    zxcva() {
        return 'zxcva';
    }
    /* qwer*/
    // asdf
}
